import React from 'react';
import { BRAND } from '../../config/brand';
import { MKInnovexaOfficialLogo } from '../brand/MKInnovexaOfficialLogo';

interface FooterProps {
  minimal?: boolean;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ minimal = false, className = '' }) => {
  if (minimal) {
    return (
      <footer className={`py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>{BRAND.copyrightNotice}</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="text-slate-700 font-medium">{BRAND.poweredByNotice}</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="font-mono text-[11px] text-slate-500">{BRAND.version}</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`mt-auto bg-white border-t border-slate-200 text-slate-500 transition-colors ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Mobile View (< sm) */}
        <div className="sm:hidden text-center space-y-1.5 text-xs py-1">
          <div className="font-medium text-slate-700">
            {BRAND.copyrightNotice}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-900">Resto<span className="text-blue-600">Setup</span></span>
            <span>·</span>
            <span className="font-mono text-[10px] text-slate-500">{BRAND.version}</span>
            <span>·</span>
            <span className="text-blue-700 font-medium">{BRAND.poweredByNotice}</span>
          </div>
        </div>

        {/* Tablet & Desktop View (>= sm) */}
        <div className="hidden sm:flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Brand Identity & Product Hierarchy */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
            <MKInnovexaOfficialLogo size="sm" variant="monogram" theme="light" />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <span className="font-bold text-slate-900 tracking-tight">{BRAND.companyName}</span>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-slate-800">
                  Resto<span className="text-blue-600">Setup</span> ERP
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  Live Cloud Database
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {BRAND.productTagline}
              </p>
            </div>
          </div>

          {/* Right: Copyright, Version, and Links */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-500">
                {BRAND.copyrightNotice}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[11px]">
              <span className="font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                {BRAND.version}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-blue-700 font-semibold font-mono">
                {BRAND.poweredByNotice}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
