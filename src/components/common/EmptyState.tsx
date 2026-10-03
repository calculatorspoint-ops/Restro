import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';
import { BRAND } from '../../config/brand';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = PackageOpen
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center max-w-md mx-auto my-6 shadow-xs">
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
      <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
        {BRAND.productName} · {BRAND.poweredByNotice}
      </div>
    </div>
  );
};
