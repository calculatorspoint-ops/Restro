import React from 'react';
import { X, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule: (moduleName: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToModule
}) => {
  const { alerts } = useData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">
                System Alerts & Notifications ({alerts.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-200 rounded-lg transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 overscroll-contain">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                All systems nominal. No active warnings or low-stock alerts.
              </div>
            ) : (
              alerts.map((alert) => {
                const Icon =
                  alert.type === 'danger'
                    ? AlertCircle
                    : alert.type === 'warning'
                    ? AlertTriangle
                    : Info;

                const borderClass =
                  alert.type === 'danger'
                    ? 'border-rose-200 bg-rose-50/50 text-rose-900'
                    : alert.type === 'warning'
                    ? 'border-amber-200 bg-amber-50/50 text-amber-900'
                    : 'border-blue-200 bg-blue-50/50 text-blue-900';

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-lg border text-xs leading-relaxed space-y-1.5 ${borderClass}`}
                  >
                    <div className="flex items-center justify-between font-semibold gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{alert.title}</span>
                      </div>
                      {alert.branchName && (
                        <span className="text-[11px] font-normal text-slate-500 shrink-0">
                          {alert.branchName}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700">{alert.message}</p>
                    <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/50">
                      <span className="text-slate-400 font-mono">
                        Module: {alert.module}
                      </span>
                      <button
                        onClick={() => {
                          onNavigateToModule(alert.module);
                          onClose();
                        }}
                        className="min-h-[36px] px-2 font-semibold text-slate-900 hover:text-emerald-700 active:bg-slate-100 rounded-md transition-colors flex items-center"
                      >
                        View in {alert.module} →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
