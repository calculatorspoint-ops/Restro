import React from 'react';
import { BRAND } from '../../config/brand';
import { MKInnovexaLogo } from '../brand/MKInnovexaLogo';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Initializing restaurant ERP database and session...'
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 select-none">
      <div className="flex flex-col items-center text-center space-y-4 max-w-sm">
        {/* Animated Brand Emblem */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-xl flex items-center justify-center relative overflow-hidden">
            <span className="font-mono text-emerald-400 font-black text-xl tracking-tight">
              MK
            </span>
            <div className="absolute inset-0 border-2 border-emerald-400/20 rounded-2xl animate-ping" />
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 ring-4 ring-slate-900 animate-pulse" />
        </div>

        {/* Product Hierarchy */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
            {BRAND.companyName}
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight mt-0.5">
            {BRAND.productName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {message}
          </p>
        </div>

        {/* Pulse Bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse" />
        </div>

        {/* Powered By Note */}
        <div className="pt-4 text-[11px] text-slate-500 font-medium">
          {BRAND.poweredByNotice} · Enterprise Suite
        </div>
      </div>
    </div>
  );
};
