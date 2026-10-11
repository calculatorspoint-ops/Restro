import React, { useState } from 'react';
import { Menu, Bell, Building, Activity, RefreshCw, CloudOff, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { BRAND } from '../../config/brand';
import { PerformanceDiagnosticsModal } from '../common/PerformanceDiagnosticsModal';
import { RestoSetupLogo } from '../brand/RestoSetupLogo';
import { getRoleDisplayName } from '../../types';

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
  const { currentUser, logout, isMasterAdmin, isSuperManager } = useAuth();
  const { activeBranch, selectedBranchId, alerts, syncStatus, pendingWritesCount, lastSyncTime, reloadState, forceReconnect } = useData();
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between text-slate-800">
        {/* Left: Mobile hamburger + Mobile Brand / Desktop Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleMobile}
            className="lg:hidden min-w-[42px] min-h-[42px] flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Header Branding: RestoSetup mark + Section title */}
          <div className="flex items-center gap-2 lg:hidden min-w-0">
            <div className="p-0.5 rounded-lg bg-white border border-slate-200 shadow-xs shrink-0">
              <RestoSetupLogo size={26} />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[260px]">
                {title}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block truncate">
                Resto<span className="text-blue-600 font-semibold">Setup</span> · {BRAND.companyName}
              </span>
            </div>
          </div>

          {/* Desktop Breadcrumbs */}
          <div className="hidden lg:block min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="font-extrabold text-slate-900 font-sans inline-flex items-center gap-1.5 tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Resto<span className="text-blue-600">Setup</span>
              </span>
              <span className="text-slate-300" aria-hidden="true">/</span>
              <span className="text-slate-500 font-medium font-sans">{BRAND.productShortName}</span>
              <span className="text-slate-300" aria-hidden="true">/</span>
              <span className="text-slate-900 font-bold font-sans text-sm">{title}</span>
              {selectedBranchId !== 'all' && activeBranch && (
                <>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                    <Building className="w-3.5 h-3.5 inline text-blue-600" />
                    {activeBranch.code} ({activeBranch.city})
                  </span>
                </>
              )}
            </div>
            {subtitle && (
              <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xl">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live Cloud Sync Indicator */}
          {syncStatus === 'connecting' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-mono text-blue-700">
              <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
              <span className="font-medium">Connecting to DB…</span>
            </div>
          )}
          {syncStatus === 'loading' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-mono text-blue-700">
              <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
              <span className="font-medium">Loading cache…</span>
            </div>
          )}
          {syncStatus === 'syncing' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-mono text-blue-700">
              <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
              <span className="font-medium">Syncing DB…</span>
            </div>
          )}
          {syncStatus === 'pending' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-800">
              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
              <span className="font-medium">Pending ({pendingWritesCount || 1})</span>
            </div>
          )}
          {syncStatus === 'synced' && (
            <button
              onClick={() => reloadState(true)}
              title={`Cloud Firestore synchronized. ${lastSyncTime ? `Last confirmed: ${new Date(lastSyncTime).toLocaleTimeString()}` : ''}. Click to force refresh.`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium">Online / Synced</span>
            </button>
          )}
          {syncStatus === 'offline' && (
            <button
              onClick={() => forceReconnect()}
              title="Working offline with local persistent cache. Click to reconnect to Cloud Firestore."
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-mono text-amber-800 transition-colors cursor-pointer"
            >
              <CloudOff className="w-3 h-3 text-amber-600" />
              <span className="font-medium">Offline (Cached) · Reconnect</span>
            </button>
          )}
          {syncStatus === 'error' && (
            <button
              onClick={() => forceReconnect()}
              title="Sync failed or interrupted. Click to reconnect."
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[11px] font-mono text-rose-700 transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span className="font-medium">Database connection error (Retry)</span>
            </button>
          )}

          {/* Super Manager / Role Badge Display */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-mono text-purple-700 font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>{isSuperManager ? 'Super Manager' : getRoleDisplayName(currentUser?.role, isMasterAdmin)}</span>
          </div>

          {/* Performance Diagnostics button */}
          <button
            onClick={() => setDiagnosticsOpen(true)}
            className="min-w-[40px] min-h-[40px] px-2.5 flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-xs cursor-pointer"
            title="Database Performance & Diagnostics"
            aria-label="View performance diagnostics"
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-mono font-medium hidden md:inline">Perf</span>
          </button>

          {/* System Alerts button */}
          <button
            onClick={onOpenAlerts}
            className="relative min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-xs cursor-pointer"
            title="System Notifications & Alerts"
            aria-label="View system alerts"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* User quick status & logout */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name?.split(' ')[0] || 'User'}
              </div>
              <div className={`text-[10px] font-semibold capitalize ${isSuperManager ? 'text-purple-700' : 'text-blue-600'}`}>
                {isSuperManager ? 'Super Manager' : getRoleDisplayName(currentUser?.role, isMasterAdmin)}
              </div>
            </div>

            <button
              onClick={logout}
              className="min-h-[38px] px-3 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs active:bg-rose-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Diagnostics Modal */}
      <PerformanceDiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
      />
    </>
  );
};
