import React, { useState, useEffect } from 'react';
import { Globe, Shield, Sparkles, ChevronDown, Check, HelpCircle, Calendar } from 'lucide-react';
import { KmuLogo } from './KmuLogo';
import { Language } from '../types';
import { translations } from '../constants/translations';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { translateText } from '../services/translator';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'faq' | 'downloads' | 'inquiry' | 'schedule' | 'admin';
  setActiveTab: (tab: 'faq' | 'downloads' | 'inquiry' | 'schedule' | 'admin') => void;
}

const languages: { code: Language; label: string; native: string; flag: string }[] = [
  { code: 'ko', label: 'KO', native: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'EN', native: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'VN', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'mn', label: 'MN', native: 'Монгол', flag: '🇲🇳' },
  { code: 'zh', label: 'CN', native: '中文', flag: '🇨🇳' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  activeTab,
  setActiveTab,
}) => {
  const t = translations[currentLang] || translations.ko;
  const { isAdmin, user } = useAuth();
  const { config, isDesignMode, setIsDesignMode } = useTheme();

  const [showTooltip, setShowTooltip] = useState(false);
  const [showGoogleDropdown, setShowGoogleDropdown] = useState(false);
  const [transPortalName, setTransPortalName] = useState('');

  useEffect(() => {
    if (currentLang === 'ko') {
      setTransPortalName('');
      return;
    }
    let isMounted = true;
    if (config.heroTitle && config.heroTitle !== '계명대학교 한국어학당 가이드') {
      translateText(config.heroTitle, currentLang).then((res) => {
        if (isMounted) setTransPortalName(res);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [currentLang, config.heroTitle]);

  // First-time visit tooltip
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('kmu_lang_tooltip_seen');
    if (!hasSeenTooltip) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem('kmu_lang_tooltip_seen', 'true');
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Initialize Google Translate Element on demand
  const handleGoogleTranslateInit = () => {
    setShowGoogleDropdown((prev) => !prev);
    if (!(window as unknown as { googleTranslateInitDone?: boolean }).googleTranslateInitDone) {
      (window as unknown as { googleTranslateInitDone?: boolean }).googleTranslateInitDone = true;
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      (window as unknown as { googleTranslateElementInit?: () => void }).googleTranslateElementInit = () => {
        new (window as unknown as { google: { translate: { TranslateElement: new (cfg: unknown, el: string) => void } } }).google.translate.TranslateElement(
          {
            pageLanguage: 'ko',
            includedLanguages: 'ko,en,vi,zh-CN,mn,ja,ru,uz,th,id,ne,my,km,fr,es,de,ar',
            layout: 0,
          },
          'google_translate_element'
        );
      };
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E5E8] shadow-xs">
      {/* Top Utility Bar */}
      <div className="bg-[#f0f3f6] border-b border-[#E2E5E8] px-3 sm:px-4 py-1.5 text-xs text-gray-600">
        <div className="max-w-6xl mx-auto flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-3 relative w-full sm:w-auto justify-between sm:justify-end">
            {/* First-time visit Language Notification Tooltip */}
            {showTooltip && (
              <div className="absolute right-2 sm:right-32 top-8 z-50 bg-[#1A3B6B] text-white px-3 py-1.5 rounded shadow-lg text-xs flex items-center gap-2 animate-bounce max-w-[calc(100vw-1.5rem)]">
                <span className="truncate">{t.langTooltip}</span>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="text-white hover:text-gray-200 ml-1 font-bold p-1"
                  aria-label="Close tooltip"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Language Quick Toggle Buttons */}
            <div className="flex items-center bg-white rounded border border-[#E2E5E8] p-0.5 overflow-x-auto no-scrollbar touch-scroll shrink-0">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  title={`${lang.native} (${lang.label})`}
                  className={`px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-xs transition-colors flex items-center gap-0.5 sm:gap-1 cursor-pointer shrink-0 min-h-[28px] sm:min-h-0 ${
                    currentLang === lang.code
                      ? 'bg-[#1A3B6B] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#1A3B6B] hover:bg-gray-100'
                  }`}
                >
                  <span className="text-[10px] sm:text-[11px]">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>

            {/* Google Translate dropdown toggle & Admin links */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative">
                <button
                  onClick={handleGoogleTranslateInit}
                  className="flex items-center gap-1 px-2 py-1 rounded border border-[#E2E5E8] bg-white text-gray-700 hover:bg-gray-50 text-[11px] sm:text-xs shrink-0 cursor-pointer min-h-[28px] sm:min-h-0"
                  title="Google Translate (100+ Languages)"
                  aria-label="Google Translate"
                >
                  <Globe className="w-3.5 h-3.5 text-[#1A3B6B]" />
                  <span className="hidden md:inline">Google 번역</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {showGoogleDropdown && (
                  <div className="absolute right-0 top-full mt-1 z-50 p-2.5 bg-white rounded border border-[#E2E5E8] shadow-md min-w-[200px] max-w-[calc(100vw-2rem)]">
                    <p className="text-[11px] text-gray-500 mb-1">
                      다국어 자동 번역 (Google Translate):
                    </p>
                    <div id="google_translate_element" className="min-h-[30px]" />
                  </div>
                )}
              </div>

              {/* Admin status / quick link */}
              {isAdmin ? (
                <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-gray-300 shrink-0">
                  <button
                    onClick={() => setIsDesignMode(!isDesignMode)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] sm:text-xs font-medium border min-h-[28px] sm:min-h-0 ${
                      isDesignMode
                        ? 'bg-[#D97736] text-white border-[#D97736]'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">{isDesignMode ? '디자인모드 종료' : '디자인 모드'}</span>
                    <span className="sm:hidden">디자인</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className="flex items-center gap-1 text-[#1A3B6B] font-semibold hover:underline text-[11px] sm:text-xs py-1"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#2E7D5B]" />
                    <span>관리자</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('admin')}
                  className="text-gray-500 hover:text-gray-800 text-[11px] sm:text-xs pl-1.5 sm:pl-2 border-l border-gray-300 shrink-0 cursor-pointer py-1"
                >
                  <span className="hidden sm:inline">관리자 로그인</span>
                  <span className="sm:hidden">로그인</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-2.5 md:gap-3">
        {/* Brand Portal Name & Logo */}
        <div
          onClick={() => setActiveTab('faq')}
          className="cursor-pointer group flex items-center gap-2 sm:gap-2.5 md:gap-3 min-w-0"
        >
          {config.logoType && config.logoType !== 'none' && (
            <div className="shrink-0 scale-90 sm:scale-100 origin-left">
              <KmuLogo config={config} />
            </div>
          )}
          <span className="block text-sm sm:text-base font-bold text-[#1A3B6B] tracking-tight group-hover:text-blue-900 transition-colors truncate">
            {transPortalName || (currentLang === 'ko' ? config.heroTitle || t.portalName : t.portalName)}
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 md:pb-0 no-scrollbar touch-scroll -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors whitespace-nowrap shrink-0 min-h-[38px] sm:min-h-[36px] flex items-center justify-center cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.navFaq}
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors whitespace-nowrap shrink-0 min-h-[38px] sm:min-h-[36px] flex items-center justify-center cursor-pointer ${
              activeTab === 'downloads'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.navDownloads}
          </button>

          <button
            onClick={() => setActiveTab('inquiry')}
            className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors whitespace-nowrap shrink-0 min-h-[38px] sm:min-h-[36px] flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'inquiry'
                ? 'bg-[#2E7D5B] text-white shadow-xs'
                : 'text-[#2E7D5B] bg-[#2E7D5B]/10 hover:bg-[#2E7D5B]/20 font-semibold'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {t.navInquiry}
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors whitespace-nowrap shrink-0 min-h-[38px] sm:min-h-[36px] flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'text-[#1A3B6B] bg-[#1A3B6B]/10 hover:bg-[#1A3B6B]/20 font-semibold'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.navSchedule || '일정표'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
