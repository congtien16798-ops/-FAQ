import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Pin, Copy, Share2, Eye, Image as ImageIcon, Check, ExternalLink, Sparkles, Globe } from 'lucide-react';
import { FaqItem, Language, FaqCategory } from '../types';
import { translations } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { translateText, translateHtml } from '../services/translator';
import { renderCategoryIcon } from './HeroSection';

interface FaqSectionProps {
  faqs: FaqItem[];
  currentLang: Language;
  selectedCategory: FaqCategory | 'all';
  setSelectedCategory: (cat: FaqCategory | 'all') => void;
  searchQuery: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  faqs,
  currentLang,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
}) => {
  const t = translations[currentLang] || translations.ko;
  const { config } = useTheme();

  const [expandedId, setExpandedId] = useState<string | null>(null);
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
      // 1. FAQs title & rich HTML content
      const newMap: Record<string, { title: string; content: string }> = {};
      for (const faq of faqs || []) {
        if (!faq) continue;
        const transTitle = await translateText(faq.title || '', currentLang);
        const transContent = await translateHtml(faq.content || '', currentLang);
        newMap[faq.id] = { title: transTitle, content: transContent };
      }

      // 2. Category names for badges
      const newCatMap: Record<string, string> = {};
      for (const cat of config.categories || []) {
        if (!cat) continue;
        if (cat.name?.[currentLang]) {
          newCatMap[cat.id] = cat.name[currentLang]!;
        } else if (cat.name?.ko) {
          newCatMap[cat.id] = await translateText(cat.name.ko, currentLang);
        } else {
          newCatMap[cat.id] = cat.id;
        }
      }

      if (isMounted) {
        setTranslatedMap(newMap);
        setCatTranslations(newCatMap);
        setIsTranslating(false);
      }
    };

    translateAll();

    return () => {
      isMounted = false;
    };
  }, [currentLang, faqs, config.categories]);

  // Filter FAQs based on category & search query (automatically pruning empty posts)
  const filteredFaqs = (faqs || []).filter((faq) => {
    if (!faq || faq.hidden) return false;
    // Empty post filter: must have a non-empty title and content (or image)
    const hasTitle = !!faq.title && faq.title.trim() !== '';
    const plainContent = (faq.content || '').replace(/<[^>]*>/g, '').trim();
    const hasContent = plainContent !== '' || !!faq.imageUrl || (faq.content || '').includes('<img');
    if (!hasTitle || !hasContent) return false;

    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
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

  const toggleExpand = (uniqueId: string) => {
    setExpandedId((prev) => (prev === uniqueId ? null : uniqueId));
  };

  const handleCopyUrl = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#faq-${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyToast(t.urlCopied);
      setTimeout(() => setCopyToast(null), 3000);
    });
  };

  const handleWebShare = async (faq: FaqItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}#faq-${faq.id}`;
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
    const found = config.categories?.find((c) => c.id === category);
    if (found) {
      const label = catTranslations[category] || found.name[currentLang] || found.name.ko || found.id;
      return { label, color: 'bg-blue-50 text-[#1A3B6B] border-blue-200' };
    }
    switch (category) {
      case 'attendance':
        return { label: t.catAttendance, color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'visa':
        return { label: t.catVisa, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'dormitory':
        return { label: t.catDormitory, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'admin':
        return { label: t.catAdmin, color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'life':
      default:
        return { label: t.catLife, color: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
  };

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: t.categoryAll, icon: null },
    ...(config.categories || []).map((cat) => ({
      id: cat.id,
      label: catTranslations[cat.id] || cat.name[currentLang] || cat.name.ko || cat.id,
      icon: renderCategoryIcon(cat.icon),
    })),
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A3B6B] text-white px-4 py-3 rounded-md shadow-lg text-sm flex items-center gap-2 border border-blue-400">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Header & Category Tabs */}
      <div className="mb-6 pb-4 border-b border-[#E2E5E8] space-y-3.5">
        <div>
          <h2 className="text-xl font-bold text-[#1A3B6B]">
            {t.navFaq}
          </h2>
        </div>

        {/* Categories Bar Under FAQ Title */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar touch-scroll sm:flex-wrap -mx-3 px-3 sm:mx-0 sm:px-0">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === 'all'
                ? (faqs || []).filter((f) => f && !f.hidden).length
                : (faqs || []).filter((f) => f && !f.hidden && f.category === cat.id).length;

            return (
              <button
                key={`faq-category-chip-${cat.id || idx}-${idx}`}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#1A3B6B] text-white border-[#1A3B6B] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white font-bold' : 'bg-gray-100 text-gray-500'
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
          <p className="text-sm font-medium">검색 결과가 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">
            다른 검색어를 입력하시거나 카테고리를 전체보기로 변경해 보세요.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
            }}
            className="mt-4 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 rounded"
          >
            카테고리 초기화
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedFaqs.map((faq, index) => {
            const uniqueItemKey = faq.id && faq.id.trim() !== '' ? faq.id.trim() : `faq-card-${index}`;
            const isExpanded = expandedId === uniqueItemKey;
            const badge = getCategoryBadge(faq.category || '');
            const titleText = (currentLang !== 'ko' && !showOriginal && translatedMap[faq.id]?.title)
              ? translatedMap[faq.id].title
              : (faq.title || '');
            const contentText = (currentLang !== 'ko' && !showOriginal && translatedMap[faq.id]?.content)
              ? translatedMap[faq.id].content
              : (faq.content || '');

            return (
              <div
                key={`faq-item-card-${uniqueItemKey}-${index}`}
                id={`faq-${uniqueItemKey}`}
                className={`bg-white rounded-md border transition-all ${
                  isExpanded
                    ? 'border-[#1A3B6B] shadow-xs'
                    : 'border-[#E2E5E8] hover:border-gray-300'
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(uniqueItemKey)}
                  className="px-4 py-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {/* Q Badge */}
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 ${
                        isExpanded
                          ? 'bg-[#1A3B6B] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Q
                    </span>

                    <div className="flex-1">
                      {/* Chips row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {faq.pinned && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/30">
                            <Pin className="w-2.5 h-2.5" />
                            <span>{t.pinned}</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {faq.views && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 ml-auto sm:ml-0">
                            <Eye className="w-3 h-3" />
                            {faq.views.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        className={`text-sm md:text-base font-semibold leading-snug ${
                          isExpanded ? 'text-[#1A3B6B]' : 'text-gray-800'
                        }`}
                      >
                        {titleText}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-1 text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#1A3B6B]" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
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
                      <span className="font-mono text-[11px]">최종 확인일: {new Date(faq.updatedAt).toLocaleDateString('ko-KR')}</span>

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
