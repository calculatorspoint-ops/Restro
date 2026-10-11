import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const Icon = type === 'error' ? AlertCircle : type === 'info' ? Info : CheckCircle2;
  const styleClass =
    type === 'error'
      ? 'bg-white text-rose-800 border-rose-200 shadow-lg shadow-rose-900/5'
      : type === 'info'
      ? 'bg-white text-blue-800 border-blue-200 shadow-lg shadow-blue-900/5'
      : 'bg-white text-emerald-800 border-emerald-200 shadow-lg shadow-emerald-900/5';

  const iconClass =
    type === 'error'
      ? 'text-rose-600'
      : type === 'info'
      ? 'text-blue-600'
      : 'text-emerald-600';

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-medium max-w-md transition-all animate-in fade-in slide-in-from-bottom-2 ${styleClass}`}
      role="status"
    >
      <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
      <span className="flex-1 text-slate-800 font-medium">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
