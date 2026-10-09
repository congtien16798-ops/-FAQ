import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Pin, Copy, Share2, Eye, Image as ImageIcon, Check, ExternalLink, Sparkles, Globe } from 'lucide-react';
import { FaqItem, Language, FaqCategory } from '../types';
import { translations } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { translateText, translateHtml, getTranslatedCategory, matchCategory, normalizeCategory } from '../services/translator';
import { renderCategoryIcon } from '../constants/categoryIcons';
import { getFaqShareUrl } from '../services/shareHelper';

interface FaqSectionProps {
  faqs: FaqItem[];
  currentLang: Language;
  selectedCategory: FaqCategory | 'all';
  setSelectedCategory: (cat: FaqCategory | 'all') => void;
  searchQuery: string;
  targetFaqId?: string | null;
  onClearTargetFaqId?: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  faqs,
  currentLang,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  targetFaqId,
  onClearTargetFaqId,
}) => {
  const t = translations[currentLang] || translations.ko;
  const { config } = useTheme();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Auto Translation State
  const [translatedMap, setTranslatedMap] = useState<Record<string, { title: string; content: string }>>({});
  const [catTranslations, setCatTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (currentLang === 'ko') {
      setTranslatedMap({});
      setCatTranslations({});
      setIsTranslating(false);
      return;
    }

    let isMounted = true;
    setIsTranslating(true);

    const translateAll = async () => {
      try {
        // 1. FAQs title & rich HTML content in parallel
        const validFaqs = (faqs || []).filter(Boolean);
        const faqPromises = validFaqs.map(async (faq) => {
          const [transTitle, transContent] = await Promise.all([
            translateText(faq.title || '', currentLang),
            translateHtml(faq.content || '', currentLang),
          ]);
          return { id: faq.id, title: transTitle, content: transContent };
        });

        // 2. Category names for badges in parallel
        const allCategoryIds = Array.from(
          new Set([
            ...(config.categories || []).map((c) => c.id),
            ...(faqs || []).map((f) => f.category).filter(Boolean),
          ])
        );

        const catPromises = allCategoryIds.map(async (catId) => {
          const found = (config.categories || []).find((c) => c.id === catId || c.name?.ko === catId);
          const koName = found?.name?.ko || catId;
          const direct = getTranslatedCategory(catId, currentLang, config.categories);
          if (direct && direct !== catId && direct !== koName) {
            return { id: catId, name: direct };
          }
          if (found?.name?.[currentLang] && found.name[currentLang] !== found.name.ko) {
            return { id: catId, name: found.name[currentLang]! };
          }
          const trans = await translateText(koName, currentLang);
          return { id: catId, name: trans };
        });

        const [faqResults, catResults] = await Promise.all([
          Promise.all(faqPromises),
          Promise.all(catPromises),
        ]);

        if (isMounted) {
          const newMap: Record<string, { title: string; content: string }> = {};
          faqResults.forEach((r) => {
            newMap[r.id] = { title: r.title, content: r.content };
          });

          const newCatMap: Record<string, string> = {};
          catResults.forEach((r) => {
            newCatMap[r.id] = r.name;
          });

          setTranslatedMap(newMap);
          setCatTranslations(newCatMap);
          setIsTranslating(false);
        }
      } catch (err) {
        console.warn('FAQ translation error:', err);
        if (isMounted) setIsTranslating(false);
      }
    };

    translateAll();

    return () => {
      isMounted = false;
    };
  }, [currentLang, faqs, config.categories]);

  // Filter FAQs based on category & search query (Safe: preserves all valid posts)
  const filteredFaqs = (faqs || []).filter((faq) => {
    if (!faq || faq.hidden) return false;

    const matchesCategory = selectedCategory === 'all' || matchCategory(faq.category, selectedCategory);
    if (!matchesCategory) return false;

    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return true;
    const title = (faq.title || '').toLowerCase();
    const content = (faq.content || '').toLowerCase();
    const category = (faq.category || '').toLowerCase();
    return title.includes(q) || content.includes(q) || category.includes(q);
  });

  // Sort: pinned first, then by custom order if set, then by date
  const sortedFaqs = [...filteredFaqs].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  // Auto-jump, expand, and highlight targeted FAQ from share links
  useEffect(() => {
    let activeTargetId = targetFaqId;
    if (!activeTargetId && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      activeTargetId = params.get('faq') || params.get('id');
      if (!activeTargetId && hash.startsWith('#faq-')) {
        activeTargetId = decodeURIComponent(hash.replace('#faq-', ''));
      }
    }

    if (!activeTargetId) return;

    const foundFaq = faqs.find((f) => f && f.id === activeTargetId);
    if (!foundFaq) return;

    // Ensure category doesn't filter out the shared post
    if (selectedCategory !== 'all' && !matchCategory(foundFaq.category, selectedCategory)) {
      setSelectedCategory('all');
    }

    // Expand and highlight immediately
    setExpandedId(foundFaq.id);
    setHighlightedId(foundFaq.id);

    // Scroll smoothly to target element
    const scrollToTarget = () => {
      const el = document.getElementById(`faq-${foundFaq.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    scrollToTarget();
    const t1 = setTimeout(scrollToTarget, 80);
    const t2 = setTimeout(scrollToTarget, 250);
    const t3 = setTimeout(scrollToTarget, 600);

    const highlightTimer = setTimeout(() => {
      setHighlightedId(null);
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(highlightTimer);
    };
  }, [targetFaqId, faqs, selectedCategory, setSelectedCategory]);

  const toggleExpand = (uniqueId: string) => {
    setExpandedId((prev) => (prev === uniqueId ? null : uniqueId));
  };

  const handleCopyUrl = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getFaqShareUrl(id);
    navigator.clipboard.writeText(url).then(() => {
      setCopyToast(t.urlCopied || '게시글 바로보기 링크가 복사되었습니다.');
      setTimeout(() => setCopyToast(null), 3000);
    });
  };

  const handleWebShare = async (faq: FaqItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getFaqShareUrl(faq.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: faq.title,
          text: `[계명대학교 한국어학당 가이드] ${faq.title}`,
          url: shareUrl,
        });
      } catch {
        // user cancelled or unsupported
      }
    } else {
      handleCopyUrl(faq.id, e);
    }
  };

  const getCategoryBadge = (category: string) => {
    const label =
      catTranslations[category] ||
      getTranslatedCategory(category, currentLang, config.categories);

    const norm = normalizeCategory(category, config.categories);
    let color = 'bg-blue-50 text-[#1A3B6B] border-blue-200';
    if (norm === 'visa') color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    else if (norm === 'dormitory') color = 'bg-indigo-50 text-indigo-800 border-indigo-200';
    else if (norm === 'admin') color = 'bg-amber-50 text-amber-800 border-amber-200';
    else if (norm === 'life') color = 'bg-purple-50 text-purple-800 border-purple-200';
    else if (norm === 'entryexit' || norm === 'entry_exit') color = 'bg-cyan-50 text-cyan-800 border-cyan-200';
    return { label, color };
  };

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: t.categoryAll, icon: null },
    ...(config.categories || []).map((cat) => ({
      id: cat.id,
      label: catTranslations[cat.id] || getTranslatedCategory(cat.id, currentLang, config.categories),
      icon: renderCategoryIcon(cat.icon),
    })),
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-7 lg:py-8">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A3B6B] text-white px-4 py-3 rounded-md shadow-lg text-sm flex items-center gap-2 border border-blue-400">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Header & Category Tabs */}
      <div className="w-full mb-5 sm:mb-6 pb-3.5 sm:pb-4 border-b border-[#E2E5E8] space-y-3">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1A3B6B]">
            {t.navFaq}
          </h2>
        </div>

        {/* Categories Bar Under FAQ Title */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar touch-scroll sm:flex-wrap">
          {categories.map((cat, idx) => {
            const isSelected =
              selectedCategory === cat.id ||
              (selectedCategory === 'all' && cat.id === 'all') ||
              (selectedCategory !== 'all' && cat.id !== 'all' && matchCategory(selectedCategory, cat.id, config.categories));
            const count =
              cat.id === 'all'
                ? (faqs || []).filter((f) => f && !f.hidden).length
                : (faqs || []).filter((f) => f && !f.hidden && matchCategory(f.category, cat.id, config.categories)).length;

            return (
              <button
                key={`faq-category-chip-${cat.id || idx}-${idx}`}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#1A3B6B] text-white border-[#1A3B6B] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion List - Multi-language Auto-Translation Info Bar */}
      {currentLang !== 'ko' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/90 border border-blue-200 px-3.5 py-2.5 rounded-md mb-4 text-xs text-blue-900 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#1A3B6B] shrink-0" />
            <span className="font-semibold">
              {isTranslating ? (t.translating || '자동 번역 변환 중...') : (t.autoTranslateBanner || 'Google 자동 번역이 적용되었습니다.')}
            </span>
          </div>
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="self-end sm:self-auto text-[11px] font-bold px-2 py-0.5 rounded border border-blue-300 bg-white hover:bg-blue-100 text-[#1A3B6B] transition-colors cursor-pointer"
          >
            {showOriginal ? (t.viewTranslated || '번역문 보기') : (t.viewOriginal || '원문(한국어) 보기')}
          </button>
        </div>
      )}

      {sortedFaqs.length === 0 ? (
        <div className="bg-white rounded-md border border-[#E2E5E8] p-12 text-center text-gray-500">
          <p className="text-sm font-medium">{searchQuery ? (t.searchResultsCount ? `0 ${t.searchResultsCount}` : '검색 결과가 없습니다.') : (t.emptyFaq || '등록된 자주 묻는 질문(FAQ)이 없습니다.')}</p>
          <p className="text-xs text-gray-400 mt-1">
            {currentLang === 'ko'
              ? '다른 검색어를 입력하시거나 카테고리를 전체보기로 변경해 보세요.'
              : currentLang === 'en'
              ? 'Please try another search keyword or select All categories.'
              : currentLang === 'vi'
              ? 'Vui lòng thử từ khóa khác hoặc chọn Tất cả danh mục.'
              : currentLang === 'zh'
              ? '请输入其他搜索词或切换到全部分类。'
              : 'Өөр түлхүүр үг оруулна уу эсвэл Бүх ангиллыг сонгоно уу.'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
            }}
            className="mt-4 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 rounded font-semibold cursor-pointer"
          >
            {t.categoryAll || '카테고리 초기화'}
          </button>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {sortedFaqs.map((faq, index) => {
            const uniqueItemKey = faq.id && faq.id.trim() !== '' ? faq.id.trim() : `faq-card-${index}`;
            const isExpanded = expandedId === uniqueItemKey;
            const isHighlighted = highlightedId === uniqueItemKey;
            const badge = getCategoryBadge(faq.category || '');
            const titleText = (currentLang !== 'ko' && !showOriginal && translatedMap[faq.id]?.title)
              ? translatedMap[faq.id].title
              : (faq.title || t.noTitle || '(제목 없음)');
            const contentText = (currentLang !== 'ko' && !showOriginal && translatedMap[faq.id]?.content)
              ? translatedMap[faq.id].content
              : (faq.content || '');

            return (
              <div
                key={`faq-item-card-${uniqueItemKey}-${index}`}
                id={`faq-${uniqueItemKey}`}
                className={`w-full bg-white rounded-md border transition-all duration-300 shadow-2xs overflow-hidden ${
                  isHighlighted
                    ? 'border-[#1A3B6B] ring-2 ring-[#1A3B6B] ring-offset-2 shadow-lg bg-blue-50/20'
                    : isExpanded
                    ? 'border-[#1A3B6B] shadow-xs'
                    : 'border-[#E2E5E8] hover:border-gray-300'
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(uniqueItemKey)}
                  className="px-3.5 sm:px-4.5 py-3 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {/* Shared link indicator */}
                    {isHighlighted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-[#1A3B6B] text-white animate-pulse shrink-0">
                        <Check className="w-3 h-3" />
                        <span>공유 링크 연결</span>
                      </span>
                    )}

                    {/* Pinned indicator if pinned */}
                    {faq.pinned && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/30 shrink-0">
                        <Pin className="w-2.5 h-2.5" />
                        <span>{t.pinned}</span>
                      </span>
                    )}

                    {/* Category (Bold, responsive size) */}
                    <span
                      className={`text-xs sm:text-sm lg:text-base font-bold shrink-0 transition-colors ${
                        isExpanded ? 'text-[#1A3B6B]' : 'text-gray-900'
                      }`}
                    >
                      {badge.label}
                    </span>

                    {/* Semi-transparent Divider Line (반투명 구분선) */}
                    <span className="w-px h-3 sm:h-3.5 lg:h-4 bg-gray-300/80 shrink-0" aria-hidden="true" />

                    {/* Question Title (Bold, responsive size, center aligned) */}
                    <h3
                      className={`text-xs sm:text-sm lg:text-base font-bold leading-snug sm:leading-relaxed flex-1 transition-colors ${
                        isExpanded ? 'text-[#1A3B6B]' : 'text-gray-800'
                      }`}
                    >
                      {titleText}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#1A3B6B]" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                    )}
                  </div>
                </div>

                {/* Accordion Content Body */}
                {isExpanded && (
                  <div className="px-3.5 sm:px-5 pb-4 sm:pb-5 pt-2 border-t border-gray-100 text-xs sm:text-sm text-gray-700 leading-relaxed bg-[#fafafa]/50">
                    {/* Render Rich Content with click-to-zoom for embedded images and overflow protection */}
                    <div
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.tagName === 'IMG') {
                          setModalImage((target as HTMLImageElement).src);
                        }
                      }}
                      className="prose prose-sm max-w-none text-gray-800 leading-relaxed overflow-x-auto break-word-safe [&_img]:cursor-zoom-in [&_img]:transition-all [&_img:hover]:opacity-95 [&_img]:max-w-full [&_table]:overflow-x-auto [&_table]:block sm:[&_table]:table"
                      dangerouslySetInnerHTML={{ __html: contentText }}
                    />

                    {/* Attached Image with click-to-zoom modal */}
                    {faq.imageUrl && (
                      <div className="mt-4 p-2 bg-white rounded border border-gray-200 block sm:inline-block max-w-full">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-[#1A3B6B]" />
                          <span>참조 안내 이미지 (클릭 시 원본 확대)</span>
                        </p>
                        <img
                          src={faq.imageUrl}
                          alt={faq.title}
                          onClick={() => setModalImage(faq.imageUrl || null)}
                          className="max-h-48 max-w-full rounded cursor-zoom-in hover:opacity-95 transition-opacity object-contain"
                        />
                      </div>
                    )}

                    {/* Action Bar: URL Copy & Web Share */}
                    <div className="mt-4 sm:mt-5 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-gray-500">
                      <span className="text-[11px] font-medium text-gray-500">최종 확인일: {new Date(faq.updatedAt).toLocaleDateString('ko-KR')}</span>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={(e) => handleCopyUrl(faq.id, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer text-xs min-h-[32px]"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#1A3B6B]" />
                          <span>{t.copyLink}</span>
                        </button>

                        <button
                          onClick={(e) => handleWebShare(faq, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#2E7D5B] bg-[#2E7D5B]/5 hover:bg-[#2E7D5B]/10 text-[#2E7D5B] transition-colors font-medium cursor-pointer text-xs min-h-[32px]"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{t.share}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-md p-2 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center px-2 py-1 border-b border-gray-200 mb-2">
              <span className="text-xs font-semibold text-gray-700">참조 서식 이미지 원본</span>
              <button
                onClick={() => setModalImage(null)}
                className="text-gray-500 hover:text-gray-900 text-sm font-bold px-2 py-0.5 rounded"
              >
                ✕ 닫기
              </button>
            </div>
            <img
              src={modalImage}
              alt="확대 이미지"
              className="max-h-[80vh] w-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
