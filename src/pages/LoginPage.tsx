import React, { useState } from 'react';
import { Building2, Shield, Lock, Mail, ArrowRight, UserCheck, CheckCircle2, Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../config/brand';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, switchUserRole } = useAuth();
  const [email, setEmail] = useState('admin@restosetup.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const ok = await login(email, password);
      if (!ok) {
        setError('Invalid email or password. You can also sign in with Google or use the quick role buttons below.');
      }
    } catch {
      setError('Login connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const ok = await loginWithGoogle();
      if (!ok) {
        setError('Google sign-in was dismissed or could not complete.');
      }
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Top Header */}
        <div className="p-6 sm:p-8 bg-slate-950 text-white border-b border-slate-800">
          {/* Parent Company Eyebrow */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase">
                {BRAND.companyName}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/80 px-1.5 py-0.5 rounded-xs border border-emerald-800/60">
              COMMERCIAL SUITE
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-inner shrink-0">
              <span className="font-mono text-emerald-400 font-extrabold text-sm">MK</span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                {BRAND.productName}
              </span>
              <span className="text-[11px] text-slate-400 font-mono tracking-tight block">
                {BRAND.productTagline}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Enterprise management system developed by {BRAND.companyName} for restaurant branch fit-out, costing, and asset lifecycle tracking.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {forgotSent && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Password reminder: for demo accounts, use password <strong>admin123</strong> or click below.</span>
            </div>
          )}

          {/* Google Sign-in with Firebase */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full min-h-[44px] py-2.5 px-4 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 active:bg-slate-100"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Authenticating with Google...' : 'Continue with Google Account'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Or Sign In with Email
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm sm:text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden min-h-[44px]"
                  placeholder="name@restosetup.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium py-1"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm sm:text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden min-h-[44px]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Logins */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick Role One-Click Demonstration
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@restosetup.com');
                  setPassword('admin123');
                  switchUserRole('super_admin');
                }}
                className="min-h-[48px] p-2 border border-slate-200 hover:border-slate-300 rounded-lg bg-slate-50 text-center hover:bg-slate-100 active:bg-slate-200 transition-colors flex flex-col justify-center items-center"
              >
                <div className="text-[11px] font-bold text-slate-800">Super Admin</div>
                <div className="text-[9px] text-slate-500">Full Access</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('manager@restosetup.com');
                  setPassword('manager123');
                  switchUserRole('admin');
                }}
                className="min-h-[48px] p-2 border border-slate-200 hover:border-slate-300 rounded-lg bg-slate-50 text-center hover:bg-slate-100 active:bg-slate-200 transition-colors flex flex-col justify-center items-center"
              >
                <div className="text-[11px] font-bold text-slate-800">Manager</div>
                <div className="text-[9px] text-slate-500">Branch Fit-out</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('staff@restosetup.com');
                  setPassword('staff123');
                  switchUserRole('staff');
                }}
                className="min-h-[48px] p-2 border border-slate-200 hover:border-slate-300 rounded-lg bg-slate-50 text-center hover:bg-slate-100 active:bg-slate-200 transition-colors flex flex-col justify-center items-center"
              >
                <div className="text-[11px] font-bold text-slate-800">Site Staff</div>
                <div className="text-[9px] text-slate-500">Inventory Entry</div>
              </button>
            </div>
          </div>

          {/* Form Bottom Powered By & Copyright */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <div className="text-[11px] text-slate-500 font-medium">
              {BRAND.poweredByNotice}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {BRAND.copyrightNotice}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
