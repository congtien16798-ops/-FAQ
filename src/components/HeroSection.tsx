import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { Language, FaqCategory, SiteConfig } from '../types';
import { translations } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { translateText } from '../services/translator';
import { renderCategoryIcon } from '../constants/categoryIcons';

export { renderCategoryIcon };

interface HeroSectionProps {
  currentLang: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: FaqCategory | 'all';
  setSelectedCategory: (cat: FaqCategory | 'all') => void;
  onSearchSubmit?: () => void;
  config?: Partial<SiteConfig>;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentLang,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  config: propConfig,
}) => {
  const t = translations[currentLang] || translations.ko;
  const themeContext = useTheme();
  const config = { ...themeContext.config, ...(propConfig || {}) };

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
      try {
        const catPromises = (config.categories || []).map(async (cat) => {
          if (cat.name[currentLang]) {
            return { id: cat.id, label: cat.name[currentLang]! };
          }
          const translated = await translateText(cat.name.ko, currentLang);
          return { id: cat.id, label: translated };
        });

        const [catResults, th, tp, tb] = await Promise.all([
          Promise.all(catPromises),
          config.heroTitle && config.heroTitle !== '계명대학교 한국어학당 가이드'
            ? translateText(config.heroTitle, currentLang)
            : Promise.resolve(''),
          config.searchPlaceholder ? translateText(config.searchPlaceholder, currentLang) : Promise.resolve(''),
          config.searchButtonText && config.searchButtonText !== '검색'
            ? translateText(config.searchButtonText, currentLang)
            : Promise.resolve(''),
        ]);

        if (isMounted) {
          const map: Record<string, string> = {};
          catResults.forEach((c) => {
            map[c.id] = c.label;
          });
          setCatLabels(map);
          if (th) setTransHeroTitle(th);
          if (tp) setTransPlaceholder(tp);
          if (tb) setTransBtnText(tb);
        }
      } catch (err) {
        console.warn('Hero translation error:', err);
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

  const effectivePlaceholder =
    config.searchPlaceholder !== undefined && config.searchPlaceholder.trim() !== ''
      ? (currentLang === 'ko' ? config.searchPlaceholder : transPlaceholder || config.searchPlaceholder)
      : t.searchPlaceholder;

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
              placeholder={effectivePlaceholder}
              className="w-full py-2 sm:py-2.5 px-2 text-gray-900 placeholder:text-gray-400 focus:outline-hidden bg-transparent min-w-0 flex-1 text-base placeholder:text-base placeholder:font-normal"
              style={{
                fontSize: 'var(--font-scale, 1rem)',
              }}
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
