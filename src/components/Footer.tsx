import React, { useState, useEffect } from 'react';
import { Phone, Clock, Mail, MapPin, Instagram, Youtube, ExternalLink } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { translateText } from '../services/translator';
import { DEFAULT_RELATED_SITES } from '../constants/initialRelatedSites';

interface FooterProps {
  currentLang: Language;
}

export const Footer: React.FC<FooterProps> = ({ currentLang }) => {
  const t = translations[currentLang] || translations.ko;
  const { config } = useTheme();

  const [transLocation, setTransLocation] = useState('');
  const [transHours, setTransHours] = useState('');

  useEffect(() => {
    if (currentLang === 'ko') {
      setTransLocation('');
      setTransHours('');
      return;
    }

    let isMounted = true;
    const transFooter = async () => {
      if (config.location) {
        const loc = await translateText(config.location, currentLang);
        if (isMounted) setTransLocation(loc);
      }
      if (config.officeHours) {
        const oh = await translateText(config.officeHours, currentLang);
        if (isMounted) setTransHours(oh);
      }
    };

    transFooter();

    return () => {
      isMounted = false;
    };
  }, [currentLang, config.location, config.officeHours]);

  return (
    <footer className="bg-[#1c2430] text-gray-300 text-xs border-t border-gray-700/60 mt-12 sm:mt-16 safe-bottom">
      {/* Main Footer Info */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6">
          {/* Col 1: Operating Hours & Contacts */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-gray-200 text-xs mb-2">
              {t.officeHoursTitle}
            </h4>
            <div className="flex items-start gap-2 text-gray-400">
              <Clock className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
              <span>{transHours || config.officeHours}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-400 pt-0.5">
              <Phone className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
              <a
                href={`tel:${config.phone.replace(/[^0-9+]/g, '')}`}
                className="hover:text-blue-300 transition-colors underline-offset-2 hover:underline min-h-[28px] inline-flex items-center"
                title="전화 걸기"
              >
                {config.phone}
              </a>
            </div>
            <div className="flex items-start gap-2 text-gray-400">
              <Mail className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
              <a
                href={`mailto:${config.email}`}
                className="hover:text-blue-300 transition-colors underline-offset-2 hover:underline min-h-[28px] inline-flex items-center break-all"
                title="이메일 보내기"
              >
                {config.email}
              </a>
            </div>
          </div>

          {/* Col 2: Location */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-200 text-xs mb-2">
              {t.locationTitle}
            </h4>
            <div className="flex items-start gap-2 text-gray-400 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
              <span>{transLocation || config.location}</span>
            </div>
          </div>

          {/* Col 3: SNS & Simple 3 Related Sites */}
          <div className="space-y-4 sm:col-span-2 md:col-span-1">
            {/* SNS */}
            <div>
              <h4 className="font-bold text-gray-200 text-xs mb-2">
                {t.snsTitle || 'SNS'}
              </h4>
              <div className="flex items-center gap-2.5">
                {config.showInstagram && (
                  <a
                    href={config.instagramUrl || 'https://www.instagram.com/keimyung_university'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded bg-gray-800 hover:bg-[#D97736] text-gray-300 hover:text-white flex items-center justify-center transition-colors min-w-[32px] min-h-[32px]"
                    title="계명대학교 공식 인스타그램"
                    aria-label="계명대학교 공식 인스타그램"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}

                {config.showYoutube && (
                  <a
                    href={config.youtubeUrl || 'https://www.youtube.com/@KeimyungUniversity'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white flex items-center justify-center transition-colors min-w-[32px] min-h-[32px]"
                    title="계명대학교 공식 유튜브"
                    aria-label="계명대학교 공식 유튜브"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Dynamic Related Sites */}
            {config.showRelatedSites !== false && (
              <div>
                <h4 className="font-bold text-gray-200 text-xs mb-2">
                  {t.relatedWebsites || '관련 웹사이트'}
                </h4>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(config.relatedSites && config.relatedSites.length > 0
                    ? config.relatedSites
                    : DEFAULT_RELATED_SITES
                  ).map((site) => (
                    <a
                      key={site.id}
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors text-[11px] min-h-[28px] group"
                      title={site.desc || site.name}
                    >
                      <span>{currentLang === 'en' && site.nameEn ? site.nameEn : site.name}</span>
                      {site.badge && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-gray-700 text-blue-300 ml-0.5 group-hover:bg-gray-600">
                          {site.badge}
                        </span>
                      )}
                      <ExternalLink className="w-2.5 h-2.5 text-gray-400 group-hover:text-white shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-4 border-t border-gray-800 text-[11px] text-gray-500 text-center sm:text-left">
          <span>{t.copyright}</span>
        </div>
      </div>
    </footer>
  );
};
