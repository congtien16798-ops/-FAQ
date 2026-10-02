import React from 'react';
import { Landmark, GraduationCap, BookOpen, Shield, Globe } from 'lucide-react';
import { SiteConfig } from '../types';

interface KmuLogoProps {
  config?: Partial<SiteConfig>;
  className?: string;
}

export const KmuLogo: React.FC<KmuLogoProps> = ({ config, className = '' }) => {
  const logoType = config?.logoType ?? 'text';
  const height = config?.logoHeight || 40;
  const textColor = config?.logoTextColor || config?.mainColor || '#1A3B6B';
  const logoText = config?.logoText ?? '계명대학교';
  const logoSubText = config?.logoSubText ?? 'KEIMYUNG UNIVERSITY';
  const symbolIcon = config?.logoSymbolIcon || 'university';
  const fontWeight = config?.logoFontWeight || 'bold';

  if (logoType === 'none') {
    return null;
  }

  // 1. Image Logo
  if (logoType === 'image') {
    const src = config?.logoUrl && config.logoUrl.trim() !== ''
      ? config.logoUrl
      : '/kmu_type67_view.jpg';

    return (
      <div
        style={{ height: `${height}px` }}
        className={`inline-flex items-center select-none ${className}`}
      >
        <img
          src={src}
          alt={logoText}
          style={{ height: `${height}px` }}
          className="w-auto h-full object-contain block"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('/src/assets/images/kmu_type67_view.jpg')) {
              target.src = '/src/assets/images/kmu_type67_view.jpg';
            }
          }}
        />
      </div>
    );
  }

  // Symbol Icon Resolver
  const renderSymbol = () => {
    const iconSize = Math.max(18, Math.round(height * 0.65));
    const iconProps = { size: iconSize, style: { color: textColor } };

    switch (symbolIcon) {
      case 'graduation':
        return <GraduationCap {...iconProps} />;
      case 'book':
        return <BookOpen {...iconProps} />;
      case 'shield':
        return <Shield {...iconProps} />;
      case 'globe':
        return <Globe {...iconProps} />;
      case 'university':
      default:
        return <Landmark {...iconProps} />;
    }
  };

  const getWeightClass = () => {
    if (fontWeight === 'black') return 'font-black';
    if (fontWeight === 'medium') return 'font-semibold';
    return 'font-bold';
  };

  // 2. Symbol + Text or 3. Text Only
  return (
    <div
      style={{ height: `${height}px` }}
      className={`inline-flex items-center gap-2 select-none ${className}`}
    >
      {logoType === 'symbol_text' && (
        <div
          className="p-1.5 rounded flex items-center justify-center shrink-0 border"
          style={{
            borderColor: `${textColor}30`,
            backgroundColor: `${textColor}0d`,
          }}
        >
          {renderSymbol()}
        </div>
      )}

      <div className="flex flex-col justify-center leading-none">
        <span
          className={`tracking-tight ${getWeightClass()}`}
          style={{
            color: textColor,
            fontSize: `${Math.max(14, Math.round(height * 0.44))}px`,
          }}
        >
          {logoText}
        </span>
        {logoSubText && (
          <span
            className="tracking-widest uppercase font-serif"
            style={{
              color: textColor,
              opacity: 0.85,
              fontSize: `${Math.max(8, Math.round(height * 0.22))}px`,
              marginTop: '2px',
            }}
          >
            {logoSubText}
          </span>
        )}
      </div>
    </div>
  );
};
