import React from 'react';
import { Menu, Bell, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { BRAND } from '../../config/brand';

interface HeaderProps {
  onToggleMobile: () => void;
  onOpenAlerts: () => void;
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobile,
  onOpenAlerts,
  title,
  subtitle
}) => {
  const { currentUser, logout } = useAuth();
  const { activeBranch, selectedBranchId, alerts, loading } = useData();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-2.5 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger + Mobile Brand / Desktop Breadcrumbs */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobile}
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
          aria-label="Toggle Navigation Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Header Branding: MK Innovexa mark + Section title */}
        <div className="flex items-center gap-2 lg:hidden min-w-0">
          <div className="w-7 h-7 rounded-md bg-slate-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-xs">
            MK
          </div>
          <div className="min-w-0 leading-tight">
            <span className="text-xs font-bold text-slate-900 block truncate max-w-[100px] xs:max-w-[160px] sm:max-w-[240px]">
              {title}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[110px] xs:max-w-[170px]">
              {BRAND.productShortName} · {BRAND.companyName}
            </span>
          </div>
        </div>

        {/* Desktop Breadcrumbs */}
        <div className="hidden lg:block min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" />
              {BRAND.companyName}
            </span>
            <span className="text-slate-300" aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">{BRAND.productShortName}</span>
            <span className="text-slate-300" aria-hidden="true">/</span>
            <span className="text-slate-900 font-semibold">{title}</span>
            {selectedBranchId !== 'all' && activeBranch && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-100">
                  <Building className="w-3.5 h-3.5 inline" />
                  {activeBranch.code} ({activeBranch.city})
                </span>
              </>
            )}
          </div>
          {subtitle && (
            <div className="text-[11px] text-slate-400 mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* System Alerts button (min 44x44px touch target) */}
        <button
          onClick={onOpenAlerts}
          className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors"
          title="System Notifications & Alerts"
          aria-label="View system alerts"
        >
          <Bell className="w-4 h-4" />
          {alerts.length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* User quick status & logout */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {currentUser?.name?.split(' ')[0]}
            </div>
            <div className="text-[10px] text-slate-500 capitalize">
              {currentUser?.role?.replace('_', ' ')}
            </div>
          </div>

          <button
            onClick={logout}
            className="min-h-[40px] px-3 text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center active:bg-rose-100"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

