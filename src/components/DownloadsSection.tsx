import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter, AlertCircle, FileCheck, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { DocumentItem, Language } from '../types';
import { translations } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { translateText } from '../services/translator';
import { triggerDocumentDownload } from '../services/downloadHelper';

interface DownloadsSectionProps {
  documents: DocumentItem[];
  currentLang: Language;
  selectedCategory?: string;
  setSelectedCategory?: (cat: string) => void;
}

export const DownloadsSection: React.FC<DownloadsSectionProps> = ({
  documents,
  currentLang,
  selectedCategory: propCategory,
  setSelectedCategory: propSetCategory,
}) => {
  const t = translations[currentLang] || translations.ko;
  const { config } = useTheme();

  const [search, setSearch] = useState('');
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const selectedCategory = propCategory !== undefined ? propCategory : internalCategory;
  const setSelectedCategory = propSetCategory || setInternalCategory;
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Auto Translation State
  const [transDocMap, setTransDocMap] = useState<Record<string, { title: string; description: string; category: string }>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (currentLang === 'ko') {
      setTransDocMap({});
      setIsTranslating(false);
      return;
    }

    let isMounted = true;
    setIsTranslating(true);

    const translateDocs = async () => {
      const newMap: Record<string, { title: string; description: string; category: string }> = {};
      for (const doc of documents) {
        const transTitle = await translateText(doc.title, currentLang);
        const transDesc = await translateText(doc.description, currentLang);
        const transCat = await translateText(doc.category, currentLang);
        newMap[doc.id] = { title: transTitle, description: transDesc, category: transCat };
      }
      if (isMounted) {
        setTransDocMap(newMap);
        setIsTranslating(false);
      }
    };

    translateDocs();

    return () => {
      isMounted = false;
    };
  }, [currentLang, documents]);

  // Extract unique categories (excluding 'all' from set to avoid duplicate with initial 'all')
  const categories = [
    'all',
    ...Array.from(
      new Set(
        (documents || [])
          .filter((d) => !d?.hidden && d?.category && d.category.trim() !== 'all')
          .map((d) => d.category.trim())
      )
    ),
  ];

  const filteredDocs = (documents || []).filter((doc) => {
    if (!doc || doc.hidden) return false;
    const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;
    if (!matchesCat) return false;
    const q = (search || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (doc.title?.toLowerCase() || '').includes(q) ||
      (doc.description?.toLowerCase() || '').includes(q) ||
      (doc.fileName?.toLowerCase() || '').includes(q) ||
      (doc.category?.toLowerCase() || '').includes(q)
    );
  });

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

  const handleDownload = (doc: DocumentItem) => {
    triggerDocumentDownload(doc);
    setDownloadSuccessToast(`'${doc.fileName}' 파일 다운로드가 시작되었습니다.`);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Download Alert Toast */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2E7D5B] text-white px-4 py-3 rounded-md shadow-lg text-sm flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 sm:mb-6 pb-3 border-b border-[#E2E5E8]">
        <h2 className="text-xl font-bold text-[#1A3B6B]">
          {t.navDownloads}
        </h2>
      </div>

      {/* Multi-language Auto-Translation Info Bar */}
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-md border border-[#E2E5E8] p-3 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll sm:flex-wrap -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
          {categories.map((cat, idx) => (
            <button
              key={`doc-filter-cat-${cat}-${idx}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[32px] flex items-center ${
                selectedCategory === cat
                  ? 'bg-[#1A3B6B] text-white border-[#1A3B6B]'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat === 'all' ? t.categoryAll : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="서식 명칭 검색..."
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-base sm:text-xs bg-gray-50 rounded border border-gray-200 focus:outline-none focus:bg-white focus:border-[#1A3B6B]"
          />
          <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400 absolute left-2.5 top-3 sm:top-2.5" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-2 sm:top-1.5 text-gray-400 hover:text-gray-600 p-1"
              aria-label="검색어 지우기"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Downloads List Cards (Unified with FAQ standard) */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-md border border-gray-200 p-12 text-center text-gray-500 shadow-xs">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">
              {t.noResults || '등록된 서식이 없습니다.'}
            </p>
          </div>
        ) : (
          filteredDocs.map((doc, idx) => {
            const formatBadge = getFormatBadge(doc?.fileType);
            const docId = doc?.id || `fallback-id-${idx}`;
            const docTitle =
              currentLang !== 'ko' && !showOriginal && transDocMap[docId]?.title
                ? transDocMap[docId].title
                : doc.title;
            const docDesc =
              currentLang !== 'ko' && !showOriginal && transDocMap[docId]?.description
                ? transDocMap[docId].description
                : doc.description;
            const docCategory =
              currentLang !== 'ko' && !showOriginal && transDocMap[docId]?.category
                ? transDocMap[docId].category
                : doc.category;

            return (
              <div
                key={`doc-card-${docId}-${idx}`}
                className="bg-white rounded-md border border-[#E2E5E8] hover:border-gray-300 transition-all shadow-2xs overflow-hidden"
              >
                {/* Main Row / Header */}
                <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    {/* Category (Bold, same font size as title) */}
                    <span className="text-sm md:text-base font-bold shrink-0 text-gray-900">
                      {docCategory}
                    </span>

                    {/* Semi-transparent Divider Line (반투명 구분선) */}
                    <span className="w-px h-3.5 sm:h-4 bg-gray-300/80 shrink-0" aria-hidden="true" />

                    {/* Document Title (Bold, same font size as category) */}
                    <h4 className="text-sm md:text-base font-bold text-gray-800 leading-snug flex-1 truncate sm:whitespace-normal">
                      {docTitle}
                    </h4>

                    {/* Format Badge */}
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded font-bold text-[10px] border border-blue-200 bg-blue-50 text-[#1A3B6B] shrink-0">
                      {formatBadge.label}
                    </span>

                    {/* File Size */}
                    <span className="hidden md:inline-block text-[11px] font-medium text-gray-400 shrink-0">
                      {doc.fileSize}
                    </span>
                  </div>

                  {/* Download Action Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1A3B6B] hover:bg-[#142e54] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs min-h-[32px]"
                      style={{ backgroundColor: config.mainColor }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.downloadForm || '다운로드'}</span>
                    </button>
                  </div>
                </div>

                {/* Document Description Body if present */}
                {docDesc && (
                  <div className="px-4 pb-3.5 pt-2 border-t border-gray-100 text-xs sm:text-sm text-gray-600 leading-relaxed bg-[#fafafa]/50">
                    <p className="line-clamp-2">{docDesc}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400 sm:hidden">
                      <span className="px-1.5 py-0.5 rounded font-bold text-[10px] border border-blue-200 bg-blue-50 text-[#1A3B6B]">
                        {formatBadge.label}
                      </span>
                      <span>{doc.fileSize}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
