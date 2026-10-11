import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Layers,
  Calculator,
  Shield,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../config/brand';
import { RestoSetupLogo } from '../components/brand/RestoSetupLogo';
import { MKInnovexaOfficialLogo } from '../components/brand/MKInnovexaOfficialLogo';

type AuthMode = 'login' | 'forgot';

export const LoginPage: React.FC = () => {
  const {
    login,
    loginWithGoogle,
    resetPassword
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Reveal password reset option after failed login attempt or via action link
  const [showForgotOption, setShowForgotOption] = useState(false);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const res = await login(email, password);
    if (!res.success) {
      setError('Incorrect email or password. Please try again.');
      setShowForgotOption(true);
    }
    setLoading(false);
  };

  // Handle Password Reset submission using real Firebase Auth functionality
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your corporate email address.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const res = await resetPassword(email.trim());
    if (res.success) {
      setSuccessMsg('Password reset instructions sent. Please check your inbox and follow the link to create a new password.');
    } else {
      setError(res.error || 'Unable to dispatch password reset email. Please verify the email address.');
    }
    setLoading(false);
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setSuccessMsg(null);
    const res = await loginWithGoogle();
    if (!res.success) {
      setError(res.error || 'Google sign-in could not be completed.');
    }
    setGoogleLoading(false);
  };

  // Quick Demo Account Selection for development testing
  const applyDemoCredentials = (targetEmail: string, targetPass = 'admin123') => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setMode('login');
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col lg:flex-row selection:bg-teal-100 selection:text-teal-900">
      {/* =========================================================================
          LEFT SECTION — Brand Presentation (Deep Navy #0F172A)
          Desktop & Tablet Brand Anchor
         ========================================================================= */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-[#0F172A] text-white flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-r border-[#1E293B]">
        {/* Subtle geometric architectural grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
          aria-hidden="true"
        />

        {/* Ambient subtle teal gradient glow in bottom-left */}
        <div 
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#0F766E]/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true" 
        />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 shadow-sm shrink-0">
              <RestoSetupLogo size={36} theme="dark" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">
                  Resto<span className="text-[#14B8A6]">Setup</span> ERP
                </span>
                <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded-sm bg-[#1E293B] text-slate-300 border border-slate-700/50">
                  v2.4
                </span>
              </div>
              <span className="text-xs text-slate-400 block">
                Commercial Restaurant Management Suite
              </span>
            </div>
          </div>
        </div>

        {/* Core Value Proposition */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <div className="space-y-3.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1E293B] border border-slate-700/60 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
              <span className="font-medium">Enterprise Cloud Infrastructure</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
              Smarter Restaurant Operations. One Connected System.
            </h1>

            <p className="text-sm xl:text-base text-slate-300 leading-relaxed font-normal">
              Manage branches, projects, assets, inventory, purchasing, and operational costs in one centralized ERP platform.
            </p>
          </div>

          {/* Three Feature Highlights */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-[#0F172A] border border-slate-700/80 text-[#14B8A6] flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-white">Centralized Branch Management</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Multi-unit visibility, location budgeting, rollout milestones, and contractor tracking in real time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-[#0F172A] border border-slate-700/80 text-[#14B8A6] flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-white">Inventory and Asset Visibility</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Complete lifecycle tracking for kitchen equipment, point of sale hardware, and stock movements.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-[#0F172A] border border-slate-700/80 text-[#14B8A6] flex items-center justify-center shrink-0 mt-0.5">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-white">Operational Cost Control</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Precision recipe costing, construction budgeting, and procurement approval workflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
            <span>Bank-Grade Encryption · Cloud Persistence</span>
          </div>

          <div className="flex items-center gap-2">
            <span>By</span>
            <span className="font-semibold text-slate-200">{BRAND.companyName}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SECTION — Login Form Card Surface (#FFFFFF on #F8FAFC)
         ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-y-auto min-h-screen">
        {/* Mobile / Tablet Compact Header */}
        <header className="lg:hidden w-full max-w-md mx-auto flex items-center justify-between py-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-lg bg-white border border-[#E2E8F0] shadow-xs">
              <RestoSetupLogo size={28} />
            </div>
            <div>
              <span className="font-bold text-[#0F172A] text-sm tracking-tight block">
                Resto<span className="text-[#0F766E]">Setup</span> ERP
              </span>
              <span className="text-[10px] text-[#64748B] block">
                By {BRAND.companyName}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Secure System
          </span>
        </header>

        {/* Center Card Surface */}
        <div className="w-full max-w-[450px] mx-auto my-auto py-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-lg shadow-slate-200/50 overflow-hidden">
            {/* Top Loading Progress Line */}
            <div
              className="h-1 w-full bg-[#F1F5F9] overflow-hidden relative"
              role="progressbar"
              aria-busy={loading || googleLoading}
              aria-label="Authentication progress"
            >
              {loading || googleLoading ? (
                <div className="h-full bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#0F766E] rounded-full w-2/5 animate-[loadingProgress_1.4s_easeInOut_infinite]" />
              ) : (
                <div className="h-full w-full bg-transparent" />
              )}
            </div>

            <div className="p-7 sm:p-9 space-y-6">
              {/* Form Header */}
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight">
                  {mode === 'login' ? 'Welcome back' : 'Reset your password'}
                </h2>
                <p className="text-sm text-[#64748B]">
                  {mode === 'login'
                    ? 'Sign in to continue to your workspace.'
                    : 'Enter your corporate email address to receive password reset instructions.'}
                </p>
              </div>

              {/* Status / Feedback Banners */}
              {error && (
                <div
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium flex-1">
                    {error}
                  </div>
                </div>
              )}

              {successMsg && (
                <div
                  className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium flex-1">
                    {successMsg}
                  </div>
                </div>
              )}

              {/* ============================================================
                  1. LOGIN MODE
                 ============================================================ */}
              {mode === 'login' && (
                <div className="space-y-5">
                  {/* Google Workspace Sign-In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                    className="w-full h-12 px-4 text-xs font-semibold text-[#0F172A] bg-white hover:bg-slate-50 active:bg-slate-100 border border-[#E2E8F0] hover:border-slate-300 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 text-[#0F766E] animate-spin shrink-0" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>
                      {googleLoading ? 'Connecting to Google Workspace...' : 'Sign in with Google Workspace'}
                    </span>
                  </button>

                  {/* Clean Divider */}
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-[#E2E8F0] w-full" />
                    <span className="bg-white px-3 text-xs text-[#64748B] font-medium whitespace-nowrap">
                      Or sign in with email
                    </span>
                  </div>

                  {/* Corporate Email & Password Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email Input */}
                    <div>
                      <label htmlFor="login-email" className="block text-xs font-medium text-[#0F172A] mb-1.5">
                        Corporate Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                        <input
                          id="login-email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-12 pl-10 pr-3 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-hidden transition-colors"
                          placeholder="name@restaurantgroup.com"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="login-password" className="text-xs font-medium text-[#0F172A]">
                          Password
                        </label>
                        {showForgotOption && (
                          <button
                            type="button"
                            onClick={() => {
                              setMode('forgot');
                              setError(null);
                              setSuccessMsg(null);
                            }}
                            className="text-xs font-medium text-[#0F766E] hover:text-[#0D645E] hover:underline cursor-pointer transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-12 pl-10 pr-11 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-hidden transition-colors font-sans"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 h-6 w-6 rounded flex items-center justify-center text-[#94A3B8] hover:text-[#334155] cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Primary Sign In Button */}
                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="w-full h-12 px-4 text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0D645E] active:bg-[#115E59] rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          <span>Signing in…</span>
                        </>
                      ) : (
                        <>
                          <span>Sign in to RestoSetup</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Secondary Forgot Password Action (if user needs it before failing) */}
                  {!showForgotOption && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-xs text-[#64748B] hover:text-[#0F766E] transition-colors cursor-pointer"
                      >
                        Forgot your corporate password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================
                  2. FORGOT PASSWORD MODE
                 ============================================================ */}
              {mode === 'forgot' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="p-3.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] leading-relaxed">
                    Provide your verified corporate email address and Firebase Authentication will dispatch an official password reset link.
                  </div>

                  <div>
                    <label htmlFor="reset-email" className="block text-xs font-medium text-[#0F172A] mb-1.5">
                      Registered Corporate Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                      <input
                        id="reset-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 pl-10 pr-3 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-hidden transition-colors"
                        placeholder="operator@restaurantgroup.com"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="w-1/3 h-12 px-3 text-xs font-semibold text-[#334155] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="flex-1 h-12 px-4 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D645E] active:bg-[#115E59] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span>Sending instructions…</span>
                        </>
                      ) : (
                        <span>Send Reset Instructions</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Quick Development Test Credentials (Only in DEV) */}
              {import.meta.env.DEV && (
                <div className="pt-4 border-t border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider font-mono block mb-2 text-center">
                    Development Quick Credentials
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyDemoCredentials('admin@restosetup.com', 'admin123')}
                      className="p-2 border border-[#E2E8F0] hover:border-slate-400 rounded-lg bg-slate-50 hover:bg-white text-center transition-colors flex flex-col justify-center items-center cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-[#0F172A]">Super Admin</div>
                      <div className="text-[9px] text-[#64748B]">Executive</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyDemoCredentials('manager@restosetup.com', 'admin123')}
                      className="p-2 border border-[#E2E8F0] hover:border-slate-400 rounded-lg bg-slate-50 hover:bg-white text-center transition-colors flex flex-col justify-center items-center cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-[#0F172A]">Manager</div>
                      <div className="text-[9px] text-[#64748B]">Branch Lead</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyDemoCredentials('staff@restosetup.com', 'staff123')}
                      className="p-2 border border-[#E2E8F0] hover:border-slate-400 rounded-lg bg-slate-50 hover:bg-white text-center transition-colors flex flex-col justify-center items-center cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-[#0F172A]">Staff</div>
                      <div className="text-[9px] text-[#64748B]">Operations</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <footer className="w-full max-w-[450px] mx-auto pt-6 text-center text-xs text-[#64748B] space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span>Developed by</span>
            <span className="font-semibold text-[#0F172A]">{BRAND.companyName}</span>
            <span aria-hidden="true">·</span>
            <span>{BRAND.version}</span>
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            {BRAND.copyrightNotice}
          </div>
        </footer>
      </div>

      {/* Embedded CSS for loading line progress animation with accessibility support */}
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
