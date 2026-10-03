import React from 'react';
import { ShieldCheck, ExternalLink, HelpCircle, FileText, Activity } from 'lucide-react';
import { BRAND } from '../../config/brand';
import { MKInnovexaLogo } from '../brand/MKInnovexaLogo';

interface FooterProps {
  minimal?: boolean;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ minimal = false, className = '' }) => {
  if (minimal) {
    return (
      <footer className={`py-4 text-center text-xs text-slate-500 border-t border-slate-200/60 ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>{BRAND.copyrightNotice}</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="text-slate-600 font-medium">{BRAND.poweredByNotice}</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="font-mono text-[11px] text-slate-400">{BRAND.version}</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`mt-auto bg-white border-t border-slate-200 text-slate-600 transition-colors ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Mobile View (< sm) */}
        <div className="sm:hidden text-center space-y-1.5 text-xs py-1">
          <div className="font-medium text-slate-700">
            {BRAND.copyrightNotice}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-600">{BRAND.productShortName}</span>
            <span>·</span>
            <span className="font-mono text-[10px]">{BRAND.version}</span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">{BRAND.poweredByNotice}</span>
          </div>
        </div>

        {/* Tablet & Desktop View (>= sm) */}
        <div className="hidden sm:flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Brand Identity & Product Hierarchy */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
            <MKInnovexaLogo size="sm" variant="monogram" theme="light" />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <span className="font-bold text-slate-900">{BRAND.companyName}</span>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-emerald-700">{BRAND.productName}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Live Operational
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {BRAND.productTagline}
              </p>
            </div>
          </div>

          {/* Right: Copyright, Version, and Links */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-700 font-medium">
                {BRAND.copyrightNotice}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-xs border border-slate-200 text-slate-600">
                {BRAND.version}
              </span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold">
                {BRAND.poweredByNotice}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
