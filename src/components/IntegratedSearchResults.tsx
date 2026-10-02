import React, { useState, useEffect } from 'react';
import {
  Search,
  HelpCircle,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  CheckCircle2,
  Copy,
  Share2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Globe
} from 'lucide-react';
import { FaqItem, DocumentItem, Language } from '../types';
import { translations } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { translateText, translateHtml } from '../services/translator';
import { triggerDocumentDownload } from '../services/downloadHelper';

interface IntegratedSearchResultsProps {
  faqs: FaqItem[];
  documents: DocumentItem[];
  searchQuery: string;
  onClearSearch: () => void;
  currentLang: Language;
  onNavigateTab: (tab: 'faq' | 'downloads' | 'inquiry' | 'schedule') => void;
}

export const IntegratedSearchResults: React.FC<IntegratedSearchResultsProps> = ({
  faqs,
  documents,
  searchQuery,
  onClearSearch,
  currentLang,
  onNavigateTab,
}) => {
  const t = translations[currentLang] || translations.ko;
  const { config } = useTheme();

  const [searchFilterTab, setSearchFilterTab] = useState<'all' | 'faq' | 'docs'>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Auto translations
  const [transFaqMap, setTransFaqMap] = useState<Record<string, { title: string; content: string }>>({});
  const [transDocMap, setTransDocMap] = useState<Record<string, { title: string; description: string }>>({});
  const [catTranslations, setCatTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentLang === 'ko') {
      setTransFaqMap({});
      setTransDocMap({});
      setCatTranslations({});
      return;
    }

    let isMounted = true;
    const translateSearchResults = async () => {
      // 1. FAQs
      const newFaqMap: Record<string, { title: string; content: string }> = {};
      for (const faq of faqs) {
        const transTitle = await translateText(faq.title, currentLang);
        const transContent = await translateHtml(faq.content, currentLang);
        newFaqMap[faq.id] = { title: transTitle, content: transContent };
      }

      // 2. Docs
      const newDocMap: Record<string, { title: string; description: string }> = {};
      for (const doc of documents) {
        const transTitle = await translateText(doc.title, currentLang);
        const transDesc = await translateText(doc.description, currentLang);
        newDocMap[doc.id] = { title: transTitle, description: transDesc };
      }

      // 3. Categories
      const newCatMap: Record<string, string> = {};
      for (const cat of config.categories || []) {
        if (cat.name[currentLang]) {
          newCatMap[cat.id] = cat.name[currentLang]!;
        } else {
          newCatMap[cat.id] = await translateText(cat.name.ko, currentLang);
        }
      }

      if (isMounted) {
        setTransFaqMap(newFaqMap);
        setTransDocMap(newDocMap);
        setCatTranslations(newCatMap);
      }
    };

    translateSearchResults();
    return () => {
      isMounted = false;
    };
  }, [currentLang, faqs, documents, config.categories]);

  // Normalize query
  const q = (searchQuery || '').trim().toLowerCase();

  // Matched FAQs
  const matchedFaqs = (faqs || []).filter((faq) => {
    if (!faq || faq.hidden) return false;
    if (!q) return true;
    return (
      (faq.title?.toLowerCase() || '').includes(q) ||
      (faq.content?.toLowerCase() || '').includes(q) ||
      (faq.category?.toLowerCase() || '').includes(q)
    );
  });

  // Matched Documents
  const matchedDocs = (documents || []).filter((doc) => {
    if (!doc || doc.hidden) return false;
    if (!q) return true;
    return (
      (doc.title?.toLowerCase() || '').includes(q) ||
      (doc.description?.toLowerCase() || '').includes(q) ||
      (doc.fileName?.toLowerCase() || '').includes(q) ||
      (doc.category?.toLowerCase() || '').includes(q)
    );
  });

  const totalMatches = matchedFaqs.length + matchedDocs.length;

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
        // user cancelled
      }
    } else {
      handleCopyUrl(faq.id, e);
    }
  };

  const handleDownloadDoc = (doc: DocumentItem) => {
    triggerDocumentDownload(doc);
    setDownloadToast(`'${doc.fileName}' 다운로드가 시작되었습니다.`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  const getFormatBadge = (fileType?: string) => {
    switch ((fileType || '').toLowerCase()) {
      case 'pdf':
        return { label: 'PDF', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'hwp':
        return { label: 'HWP', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'docx':
        return { label: 'DOCX', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'xlsx':
        return { label: 'XLSX', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: (fileType || 'FILE').toUpperCase(), color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const getFaqCategoryLabel = (catId: string) => {
    const found = config.categories?.find((c) => c.id === catId);
    if (found) {
      return catTranslations[catId] || found.name[currentLang] || found.name.ko || found.id;
    }
    return catId;
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-5 sm:space-y-6">
      {/* Toast Notifications */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A3B6B] text-white px-4 py-3 rounded-md shadow-lg text-sm flex items-center gap-2 border border-blue-400">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2E7D5B] text-white px-4 py-3 rounded-md shadow-lg text-sm flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Comprehensive Search Header Bar */}
      <div className="bg-white rounded-md border border-[#E2E5E8] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-[#1A3B6B] text-white flex items-center gap-1 shrink-0">
              <Search className="w-3 h-3" />
              <span>종합 검색 결과</span>
            </span>
            <span className="text-xs text-gray-500 font-mono">
              총 <strong className="text-gray-900 font-bold">{totalMatches}</strong>건 일치
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2 flex-wrap">
            <span>&ldquo;{searchQuery}&rdquo;</span>
            <span className="text-xs font-normal text-gray-500">통합 검색 결과</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            FAQ(<strong className="text-[#1A3B6B]">{matchedFaqs.length}</strong>건)과 서식·자료실(<strong className="text-[#2E7D5B]">{matchedDocs.length}</strong>건)을 종합 검색한 결과입니다.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClearSearch}
            className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>검색 초기화 (전체보기)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs: All vs FAQs vs Documents */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-[#E2E5E8] pb-2.5 overflow-x-auto no-scrollbar touch-scroll sm:flex-wrap -mx-3 px-3 sm:mx-0 sm:px-0">
        <button
          onClick={() => setSearchFilterTab('all')}
          className={`px-3.5 sm:px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            searchFilterTab === 'all'
              ? 'bg-[#1A3B6B] text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>전체 통합 결과</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              searchFilterTab === 'all' ? 'bg-white/20 text-white font-mono' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {totalMatches}
          </span>
        </button>

        <button
          onClick={() => setSearchFilterTab('faq')}
          className={`px-3.5 sm:px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            searchFilterTab === 'faq'
              ? 'bg-[#1A3B6B] text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>자주 묻는 질문 FAQ</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              searchFilterTab === 'faq' ? 'bg-white/20 text-white font-mono' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {matchedFaqs.length}
          </span>
        </button>

        <button
          onClick={() => setSearchFilterTab('docs')}
          className={`px-3.5 sm:px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            searchFilterTab === 'docs'
              ? 'bg-[#2E7D5B] text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>서식 및 자료실</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              searchFilterTab === 'docs' ? 'bg-white/20 text-white font-mono' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {matchedDocs.length}
          </span>
        </button>
      </div>

      {/* Case 0: Empty Results in both sections */}
      {totalMatches === 0 && (
        <div className="bg-white rounded-md border border-[#E2E5E8] p-12 text-center text-gray-600 space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              &lsquo;{searchQuery}&rsquo;에 대한 검색 결과를 찾을 수 없습니다.
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              단어의 철자가 맞는지 확인하시거나 보다 일반적인 키워드(예: 비자, 출석, 기숙사, 외박, 신청서)로 다시 검색해 보세요.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onClearSearch}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 rounded cursor-pointer transition-colors"
            >
              전체 목록 보기
            </button>
            <button
              onClick={() => onNavigateTab('inquiry')}
              className="px-4 py-2 bg-[#2E7D5B] hover:bg-[#24664a] text-xs font-bold text-white rounded cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>1:1 빠른 문의 남기기</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: FAQ MATCHES */}
      {(searchFilterTab === 'all' || searchFilterTab === 'faq') && matchedFaqs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#1A3B6B] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1A3B6B]" />
              <span>자주 묻는 질문 FAQ 검색 결과</span>
              <span className="text-xs font-normal text-gray-500">({matchedFaqs.length}건)</span>
            </h3>

            {searchFilterTab === 'all' && matchedFaqs.length > 3 && (
              <button
                onClick={() => setSearchFilterTab('faq')}
                className="text-xs text-[#1A3B6B] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>FAQ 결과 전체보기 ({matchedFaqs.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {matchedFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              const titleToRender = transFaqMap[faq.id]?.title || faq.title;
              const contentToRender = transFaqMap[faq.id]?.content || faq.content;
              const catBadge = getFaqCategoryLabel(faq.category);

              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-md border border-[#E2E5E8] shadow-2xs overflow-hidden transition-all duration-200 hover:border-gray-300"
                >
                  {/* Question Header Row */}
                  <div
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                    className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors select-none min-h-[44px]"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 pr-2 sm:pr-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#1A3B6B] border border-blue-200 shrink-0">
                        {catBadge}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {titleToRender}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#1A3B6B]" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {isExpanded && (
                    <div className="px-3.5 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-gray-100 bg-[#fafafa]/60 text-xs text-gray-700 leading-relaxed">
                      <div
                        className="prose prose-sm max-w-none text-gray-800 leading-relaxed overflow-x-auto break-word-safe"
                        dangerouslySetInnerHTML={{ __html: contentToRender }}
                      />

                      <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-gray-500">
                        <span className="font-mono">
                          등록일: {new Date(faq.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={(e) => handleCopyUrl(faq.id, e)}
                            className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-200 flex items-center gap-1.5 cursor-pointer transition-colors min-h-[30px]"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#1A3B6B]" />
                            <span>URL 복사</span>
                          </button>
                          <button
                            onClick={(e) => handleWebShare(faq, e)}
                            className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-200 flex items-center gap-1.5 cursor-pointer transition-colors min-h-[30px]"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>공유</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: DOCUMENTS / FORMS MATCHES */}
      {(searchFilterTab === 'all' || searchFilterTab === 'docs') && matchedDocs.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <h3 className="text-sm font-bold text-[#2E7D5B] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2E7D5B]" />
              <span>서식 및 자료실 검색 결과</span>
              <span className="text-xs font-normal text-gray-500">({matchedDocs.length}건)</span>
            </h3>

            {searchFilterTab === 'all' && matchedDocs.length > 3 && (
              <button
                onClick={() => setSearchFilterTab('docs')}
                className="text-xs text-[#2E7D5B] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>서식 결과 전체보기 ({matchedDocs.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-md border border-[#E2E5E8] shadow-2xs overflow-hidden">
            {/* MOBILE VIEW (< 640px): Cards */}
            <div className="block sm:hidden divide-y divide-gray-100">
              {matchedDocs.map((doc) => {
                const badge = getFormatBadge(doc.fileType);
                const titleToRender = transDocMap[doc.id]?.title || doc.title;
                const descToRender = transDocMap[doc.id]?.description || doc.description;

                return (
                  <div key={doc.id} className="p-3.5 space-y-2 hover:bg-emerald-50/20 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                          {doc.category}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {doc.fileSize}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                        {titleToRender}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {descToRender}
                      </p>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => handleDownloadDoc(doc)}
                        className="w-full py-2 px-3 rounded bg-[#2E7D5B] hover:bg-[#25664a] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>서식 다운로드 ({badge.label})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TABLET & DESKTOP VIEW (>= 640px): Standard Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <th className="py-2.5 px-3 w-24">분류</th>
                    <th className="py-2.5 px-3 w-16 text-center">형식</th>
                    <th className="py-2.5 px-4">서식명 및 상세 설명</th>
                    <th className="py-2.5 px-3 w-20 text-center">용량</th>
                    <th className="py-2.5 px-3 w-20 text-center">다운로드</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {matchedDocs.map((doc) => {
                    const badge = getFormatBadge(doc.fileType);
                    const titleToRender = transDocMap[doc.id]?.title || doc.title;
                    const descToRender = transDocMap[doc.id]?.description || doc.description;

                    return (
                      <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3 text-gray-500 font-medium">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[10px] font-extrabold rounded border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900 text-xs mb-0.5">{titleToRender}</p>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{descToRender}</p>
                        </td>
                        <td className="py-3 px-3 text-center text-gray-400 font-mono text-[11px]">
                          {doc.fileSize}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDownloadDoc(doc)}
                            className="inline-flex items-center justify-center p-2 rounded text-white bg-[#2E7D5B] hover:bg-[#25664a] shadow-2xs transition-colors cursor-pointer"
                            title={`'${doc.fileName}' 서식 다운로드`}
                            aria-label={`'${doc.fileName}' 서식 다운로드`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
