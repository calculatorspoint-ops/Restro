import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const Icon = type === 'error' ? AlertCircle : type === 'info' ? Info : CheckCircle2;
  const bgClass =
    type === 'error'
      ? 'bg-rose-900/90 text-rose-50 border-rose-700'
      : type === 'info'
      ? 'bg-sky-900/90 text-sky-50 border-sky-700'
      : 'bg-emerald-900/90 text-emerald-50 border-emerald-700';

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-xs text-xs font-medium max-w-md transition-all animate-in fade-in slide-in-from-bottom-2 ${bgClass}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded-sm transition-colors text-white/70 hover:text-white"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
