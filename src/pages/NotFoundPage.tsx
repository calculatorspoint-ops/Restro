import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home, Building2 } from 'lucide-react';
import { BRAND } from '../config/brand';
import { MKInnovexaLogo } from '../components/brand/MKInnovexaLogo';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex justify-center">
          <MKInnovexaLogo size="lg" />
        </div>

        {/* 404 Visual Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '10s' }} />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block">
            Error 404 · Route Not Found
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Page Not Located
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            The requested module, branch identifier, or administrative page does not exist or has been relocated within {BRAND.productName}.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          {BRAND.poweredByNotice} · {BRAND.copyrightNotice}
        </div>
      </div>
    </div>
  );
};
