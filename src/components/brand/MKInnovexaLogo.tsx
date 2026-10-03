import React, { useState } from 'react';
import { BRAND } from '../../config/brand';

interface MKInnovexaLogoProps {
  variant?: 'full' | 'monogram' | 'badge' | 'header';
  theme?: 'dark' | 'light';
  showProduct?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MKInnovexaLogo: React.FC<MKInnovexaLogoProps> = ({
  variant = 'badge',
  theme = 'dark',
  showProduct = false,
  className = '',
  size = 'md'
}) => {
  const [imageError, setImageError] = useState(false);

  // Size dimensions
  const dims = {
    sm: { box: 'w-7 h-7 text-xs', text: 'text-xs', sub: 'text-[9px]', productText: 'text-xs' },
    md: { box: 'w-8 h-8 text-sm', text: 'text-sm', sub: 'text-[10px]', productText: 'text-sm' },
    lg: { box: 'w-10 h-10 text-base', text: 'text-base', sub: 'text-xs', productText: 'text-base' }
  }[size];

  const isDark = theme === 'dark';

  // Crisp official monogram mark
  const monogramMark = (
    <div
      className={`${dims.box} rounded-lg ${
        isDark
          ? 'bg-slate-950 border border-emerald-500/30 text-white'
          : 'bg-slate-900 border border-emerald-500/40 text-white'
      } flex items-center justify-center font-bold tracking-tight shadow-xs shrink-0 select-none relative group`}
      title="MK Innovexa Official Monogram"
    >
      <span className="font-mono text-emerald-400 font-extrabold text-[11px] tracking-tighter">
        MK
      </span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-slate-900" />
    </div>
  );

  if (variant === 'monogram') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {monogramMark}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {monogramMark}
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight text-xs ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              {BRAND.companyName}
            </span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-xs font-semibold uppercase tracking-wider ${
                isDark
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              Enterprise
            </span>
          </div>
          {showProduct && (
            <span
              className={`block text-[11px] font-semibold tracking-tight ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {BRAND.productName}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full or Badge variant
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {monogramMark}
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-tight ${dims.text} ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {BRAND.companyName}
          </span>
        </div>
        {showProduct ? (
          <div
            className={`flex items-center gap-1 mt-0.5 font-medium ${dims.sub} ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span className="font-semibold text-emerald-500">{BRAND.productShortName}</span>
            <span>·</span>
            <span>ERP Platform</span>
          </div>
        ) : (
          <span
            className={`block font-mono tracking-wider uppercase ${dims.sub} ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Enterprise Systems
          </span>
        )}
      </div>
    </div>
  );
};
