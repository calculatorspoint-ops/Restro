import React from 'react';
import { BRAND } from '../../config/brand';
import { RestoSetupLogo } from '../brand/RestoSetupLogo';
import { MKInnovexaOfficialLogo } from '../brand/MKInnovexaOfficialLogo';

interface LoadingScreenProps {
  message?: string;
  stage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Preparing your workspace',
  stage
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between items-center p-6 sm:p-10 select-none overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading RestoSetup ERP"
    >
      {/* Top Header Status Stamp */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 text-xs text-[#64748B]">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span className="font-medium text-[#334155]">Cloud Database Active</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#64748B]">
          <span>TLS 1.3 ENCRYPTED</span>
          <span aria-hidden="true">·</span>
          <span>ENTERPRISE v2.4</span>
        </div>
      </header>

      {/* Main Focus: Branded Loading Presentation */}
      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto z-10 my-auto py-8">
        {/* RestoSetup Logo Focal Point */}
        <div className="relative mb-6">
          <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
            <RestoSetupLogo size={72} />
          </div>
        </div>

        {/* Application Title & Hierarchy */}
        <div className="space-y-1.5 mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
            RestoSetup ERP
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Enterprise Restaurant Operations & Asset Suite
          </p>
        </div>

        {/* Restrained Teal Progress Bar */}
        <div className="w-full max-w-xs space-y-3">
          <div
            className="h-1 w-full bg-[#E2E8F0] rounded-full overflow-hidden relative"
            role="progressbar"
            aria-busy="true"
            aria-label="Session initialization progress"
          >
            <div className="h-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-full w-2/5 animate-[loadingProgress_1.4s_easeInOut_infinite]" />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
              <span>{message}</span>
            </span>
            <span className="text-[11px] text-[#64748B]">
              {stage ? stage : 'Securely connecting to your account'}
            </span>
          </div>
        </div>
      </main>

      {/* Footer Area: MK Innovexa Brand Attribution */}
      <footer className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E2E8F0] z-10 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <MKInnovexaOfficialLogo variant="monogram" size="sm" theme="light" />
          <div className="leading-tight text-left">
            <span className="text-xs font-semibold text-[#0F172A] block">
              Developed by <span className="text-[#0F766E] font-bold">{BRAND.companyName}</span>
            </span>
            <span className="text-[10px] text-[#64748B] block">
              Enterprise Commercial Solutions
            </span>
          </div>
        </div>

        <div className="text-[11px] text-[#64748B] text-center sm:text-right">
          <span>{BRAND.copyrightNotice}</span>
          <span className="text-[10px] text-[#64748B] block mt-0.5">
            Architecture for Multi-Branch Hospitality Networks
          </span>
        </div>
      </footer>

      {/* Hardware-accelerated CSS animation with prefers-reduced-motion */}
      <style>{`
        @keyframes loadingProgress {
          0% {
            transform: translateX(-120%);
          }
          50% {
            transform: translateX(120%);
          }
          100% {
            transform: translateX(360%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[loadingProgress_1\\.4s_easeInOut_infinite\\] {
            animation-duration: 4s !important;
          }
        }
      `}</style>
    </div>
  );
};
