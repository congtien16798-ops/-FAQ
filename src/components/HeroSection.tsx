import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  ArrowRight, 
  Sparkles, 
  CalendarCheck, 
  FileBadge, 
  Building2, 
  ScrollText, 
  GraduationCap, 
  HeartPulse, 
  BookOpen, 
  HelpCircle, 
  Compass, 
  Coins, 
  Briefcase 
} from 'lucide-react';
import { Language, FaqCategory } from '../types';
import { translations } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { translateText } from '../services/translator';

interface HeroSectionProps {
  currentLang: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: FaqCategory | 'all';
  setSelectedCategory: (cat: FaqCategory | 'all') => void;
  onSearchSubmit?: () => void;
}

export const renderCategoryIcon = (iconName: string, className = "w-3.5 h-3.5") => {
  switch (iconName) {
    case 'CalendarCheck':
      return <CalendarCheck className={className} />;
    case 'FileBadge':
      return <FileBadge className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'ScrollText':
      return <ScrollText className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentLang,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const t = translations[currentLang] || translations.ko;
  const { config } = useTheme();

  // Dynamic categories with automatic translation
  const [catLabels, setCatLabels] = useState<Record<string, string>>({});
  const [transHeroTitle, setTransHeroTitle] = useState('');
  const [transPlaceholder, setTransPlaceholder] = useState('');
  const [transBtnText, setTransBtnText] = useState('');

  useEffect(() => {
    if (currentLang === 'ko') {
      setCatLabels({});
      setTransHeroTitle('');
      setTransPlaceholder('');
      setTransBtnText('');
      return;
    }

    let isMounted = true;
    const translateHeroData = async () => {
      // 1. Categories
      const map: Record<string, string> = {};
      for (const cat of config.categories || []) {
        if (cat.name[currentLang]) {
          map[cat.id] = cat.name[currentLang]!;
        } else {
          map[cat.id] = await translateText(cat.name.ko, currentLang);
        }
      }

      // 2. Custom Hero Title if customized
      if (config.heroTitle && config.heroTitle !== '계명대학교 한국어학당 가이드') {
        const th = await translateText(config.heroTitle, currentLang);
        if (isMounted) setTransHeroTitle(th);
      }

      // 3. Custom Placeholder if customized
      if (config.searchPlaceholder && config.searchPlaceholder !== '비자 연장, 출석 기준, 기숙사 외박 등을 검색해 보세요') {
        const tp = await translateText(config.searchPlaceholder, currentLang);
        if (isMounted) setTransPlaceholder(tp);
      }

      // 4. Custom Button text
      if (config.searchButtonText && config.searchButtonText !== '검색') {
        const tb = await translateText(config.searchButtonText, currentLang);
        if (isMounted) setTransBtnText(tb);
      }

      if (isMounted) {
        setCatLabels(map);
      }
    };

    translateHeroData();

    return () => {
      isMounted = false;
    };
  }, [currentLang, config.categories, config.heroTitle, config.searchPlaceholder, config.searchButtonText]);

  // Dynamic categories from config with fallback
  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: t.categoryAll, icon: null },
    ...(config.categories || []).map((cat) => ({
      id: cat.id,
      label: catLabels[cat.id] || cat.name[currentLang] || cat.name.ko || cat.id,
      icon: renderCategoryIcon(cat.icon),
    })),
  ];

  const isCampusBg = config.bgType === 'campus';

  // Search Button Design attributes
  const btnSize = config.searchButtonSize || 'md';
  const btnShape = config.searchButtonShape || 'rounded';
  const btnColor = config.searchButtonColor || config.accentColor || config.mainColor || '#1A3B6B';
  const effectiveBtnText =
    transBtnText || (currentLang === 'ko' ? config.searchButtonText || '검색' : t.searchButton || 'Search');
  const showBtnIcon = config.searchButtonShowIcon ?? true;
  const iconType = config.searchButtonIconType || 'search';
  const barRadius = config.searchBarRadius ?? config.borderRadius ?? 8;

  const getButtonRadius = () => {
    if (btnShape === 'square') return '0px';
    if (btnShape === 'pill') return '9999px';
    return `${config.searchButtonRadius ?? 6}px`;
  };

  const getButtonPaddingClass = () => {
    switch (btnSize) {
      case 'sm':
        return 'px-3 py-1.5 text-xs';
      case 'lg':
        return 'px-6 py-3 text-base';
      case 'md':
      default:
        return 'px-4.5 py-2.5 text-sm';
    }
  };

  const renderButtonIcon = () => {
    if (!showBtnIcon) return null;
    const iconClass = btnSize === 'sm' ? 'w-3 h-3' : btnSize === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5';
    if (iconType === 'arrow') return <ArrowRight className={iconClass} />;
    if (iconType === 'sparkles') return <Sparkles className={iconClass} />;
    return <Search className={iconClass} />;
  };

  return (
    <div
      className={`relative border-b border-[#E2E5E8] transition-all duration-300 ${
        isCampusBg
          ? 'bg-slate-900 text-white'
          : 'bg-[#1A3B6B] text-white'
      }`}
      style={{
        backgroundColor: isCampusBg ? undefined : config.mainColor,
        backgroundImage: isCampusBg
          ? 'linear-gradient(rgba(18, 40, 75, 0.88), rgba(26, 59, 107, 0.94)), url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80")'
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-5 sm:py-6 md:py-8 text-center">
        {/* Integrated Search Box */}
        <div className="max-w-2xl mx-auto relative">
          <div
            className="relative flex items-center bg-white shadow-md border border-[#E2E5E8] focus-within:ring-2 focus-within:ring-[#2E7D5B] p-1 sm:p-1.5 transition-all"
            style={{ borderRadius: `${barRadius}px` }}
          >
            <div className="pl-2.5 sm:pl-3 pr-1.5 sm:pr-2 text-gray-400 shrink-0">
              <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={transPlaceholder || (currentLang === 'ko' ? config.searchPlaceholder || t.searchPlaceholder : t.searchPlaceholder)}
              className="w-full py-2 sm:py-2.5 px-1.5 sm:px-2 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden bg-transparent min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-gray-400 hover:text-gray-600 mr-1 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Configurable Search Button */}
            <button
              onClick={() => {}}
              className={`font-bold text-white transition-opacity hover:opacity-95 flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 shadow-xs cursor-pointer min-h-[38px] sm:min-h-[42px] ${getButtonPaddingClass()}`}
              style={{
                backgroundColor: btnColor,
                borderRadius: getButtonRadius(),
              }}
            >
              {renderButtonIcon()}
              <span className="whitespace-nowrap">{effectiveBtnText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
