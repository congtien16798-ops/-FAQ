import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Info, 
  X, 
  ExternalLink, 
  ChevronRight, 
  Check, 
  Clock,
  Sparkles 
} from 'lucide-react';
import { SiteConfig, PopupIconType, Language } from '../types';
import { translateText } from '../services/translator';
import { translations } from '../constants/translations';

interface NoticePopupProps {
  config: SiteConfig;
  currentLang?: Language;
  onNavigateTab?: (tab: 'faq' | 'downloads' | 'inquiry' | 'schedule' | 'admin') => void;
  forceOpen?: boolean;
  onCloseForceOpen?: () => void;
}

const STORAGE_KEY = 'kmu_notice_popup_dismissed';

export const NoticePopup: React.FC<NoticePopupProps> = ({
  config,
  currentLang = 'ko',
  onNavigateTab,
  forceOpen = false,
  onCloseForceOpen,
}) => {
  const t = translations[currentLang] || translations.ko;
  const [isOpen, setIsOpen] = useState(false);
  const [doNotShowToday, setDoNotShowToday] = useState(false);

  // Auto Translation for Popup
  const [transBadge, setTransBadge] = useState('');
  const [transTitle, setTransTitle] = useState('');
  const [transContent, setTransContent] = useState('');
  const [transLinkText, setTransLinkText] = useState('');

  useEffect(() => {
    if (!currentLang || currentLang === 'ko') {
      setTransBadge('');
      setTransTitle('');
      setTransContent('');
      setTransLinkText('');
      return;
    }

    let isMounted = true;
    const translateNotice = async () => {
      try {
        const [b, t, c, l] = await Promise.all([
          config.popupBadge ? translateText(config.popupBadge, currentLang) : Promise.resolve(''),
          config.popupTitle ? translateText(config.popupTitle, currentLang) : Promise.resolve(''),
          config.popupContent ? translateText(config.popupContent, currentLang) : Promise.resolve(''),
          config.popupLinkText ? translateText(config.popupLinkText, currentLang) : Promise.resolve(''),
        ]);

        if (isMounted) {
          if (b) setTransBadge(b);
          if (t) setTransTitle(t);
          if (c) setTransContent(c);
          if (l) setTransLinkText(l);
        }
      } catch (err) {
        console.warn('NoticePopup translation error:', err);
      }
    };

    translateNotice();

    return () => {
      isMounted = false;
    };
  }, [currentLang, config.popupBadge, config.popupTitle, config.popupContent, config.popupLinkText]);

  const badgeText = transBadge || (config.popupBadge ? (config.popupBadge === '중요 공지' ? t.pinned : config.popupBadge) : t.pinned);
  const titleText = transTitle || config.popupTitle || (t.pinned || '공지사항');
  const contentText = transContent || config.popupContent || '';
  const linkText = transLinkText || config.popupLinkText || (t.viewDetails || '바로가기');

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (!config.popupEnabled) {
      setIsOpen(false);
      return;
    }

    // Check if dismissed today
    try {
      const dismissedDate = localStorage.getItem(STORAGE_KEY);
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      if (dismissedDate === today) {
        setIsOpen(false);
        return;
      }
    } catch {
      // ignore
    }

    // Short timer for natural entrance
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [config.popupEnabled, forceOpen]);

  const handleClose = () => {
    if (doNotShowToday) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem(STORAGE_KEY, today);
      } catch {
        // ignore
      }
    }
    setIsOpen(false);
    if (onCloseForceOpen) {
      onCloseForceOpen();
    }
  };

  const handleActionClick = () => {
    if (config.popupLinkTab && onNavigateTab) {
      onNavigateTab(config.popupLinkTab);
    }
    handleClose();
  };

  if (!isOpen) return null;

  const color = config.popupColor || config.mainColor || '#1A3B6B';
  const style = config.popupStyle || 'modal';
  const iconType = config.popupIcon || 'bell';

  const renderIcon = () => {
    const props = { className: 'w-5 h-5 text-white' };
    switch (iconType) {
      case 'alert':
        return <AlertTriangle {...props} />;
      case 'calendar':
        return <Calendar {...props} />;
      case 'info':
        return <Info {...props} />;
      case 'bell':
      default:
        return <Bell {...props} />;
    }
  };

  // STYLE 1: Floating Bottom-Right Banner
  if (style === 'banner') {
    return (
      <aside
        aria-label="공지 팝업"
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-[calc(100vw-2.5rem)] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300 safe-bottom"
        style={{ borderRadius: `${config.borderRadius || 8}px` }}
      >
        {/* Banner Top Strip */}
        <div
          className="px-4 py-2.5 flex items-center justify-between text-white"
          style={{ backgroundColor: color }}
        >
          <div className="flex items-center gap-2">
            {renderIcon()}
            <span className="text-xs font-bold tracking-tight">
              {badgeText}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white p-1 rounded transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 text-xs text-gray-700">
          <h4 className="font-bold text-gray-900 text-sm mb-2 leading-snug">
            {titleText}
          </h4>
          <p className="whitespace-pre-line text-gray-600 leading-relaxed mb-4 max-h-40 overflow-y-auto">
            {contentText}
          </p>

          {/* Action button if configured */}
          {config.popupLinkText && (
            <button
              onClick={handleActionClick}
              className="w-full py-2 px-3 rounded text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-95 mb-3 cursor-pointer"
              style={{ backgroundColor: color }}
            >
              <span>{linkText}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Multi-language Auto-Translation Notice */}
          {currentLang !== 'ko' && (
            <div className="mb-2 text-[10px] text-blue-600 bg-blue-50/80 px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
              <span>🌐 Powered by Google Translate</span>
            </div>
          )}

          {/* Footer controls */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={doNotShowToday}
                onChange={(e) => setDoNotShowToday(e.target.checked)}
                className="rounded border-gray-300 text-[#1A3B6B] focus:ring-0 w-3.5 h-3.5"
              />
              <span>{t.doNotShowToday || '오늘 하루 동안 열지 않기'}</span>
            </label>
            <button
              onClick={handleClose}
              className="text-gray-600 hover:text-gray-900 font-semibold px-1 py-0.5"
            >
              {t.close || '닫기'}
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // STYLE 2: Center Modal (Standard University Dialog)
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden"
        style={{ borderRadius: `${config.borderRadius || 8}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between"
          style={{ backgroundColor: color }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-xs">
              {renderIcon()}
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-white/25 uppercase tracking-wider mb-0.5">
                {badgeText}
              </span>
              <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
                {titleText}
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-xs text-gray-700">
          <div className="whitespace-pre-line text-gray-700 leading-relaxed text-xs md:text-sm bg-gray-50/70 p-4 rounded border border-gray-100 max-h-60 overflow-y-auto mb-5 font-normal">
            {contentText || '등록된 공지 내용이 없습니다.'}
          </div>

          {/* Action Link button */}
          {config.popupLinkText && (
            <button
              onClick={handleActionClick}
              className="w-full py-2.5 px-4 rounded text-xs font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-95 mb-3 shadow-xs cursor-pointer"
              style={{ backgroundColor: color }}
            >
              <span>{linkText}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Multi-language Auto-Translation Notice */}
          {currentLang !== 'ko' && (
            <div className="mb-3 text-[11px] text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded border border-blue-200 flex items-center justify-between">
              <span>🌐 {t.autoTranslateBanner || `Google 자동 번역 적용 (${currentLang.toUpperCase()})`}</span>
              <span className="text-[10px] text-gray-500">Powered by Google Translate</span>
            </div>
          )}

          {/* Bottom Bar: Dismiss Today & Close */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={doNotShowToday}
                onChange={(e) => setDoNotShowToday(e.target.checked)}
                className="rounded border-gray-300 text-[#1A3B6B] focus:ring-0 w-4 h-4"
              />
              <span className="text-[11px] text-gray-600">{t.doNotShowToday || '오늘 하루 동안 열지 않기'}</span>
            </label>

            <button
              onClick={handleClose}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-semibold text-xs transition-colors"
            >
              {t.close || '닫기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
