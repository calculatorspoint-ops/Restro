import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  highlight?: boolean;
  accent?: 'gold' | 'sky' | 'emerald' | 'amber' | 'purple' | 'blue';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral',
  highlight = false,
  accent = 'blue'
}) => {
  return (
    <div
      className={`relative overflow-hidden p-4 sm:p-5 rounded-xl border transition-all duration-150 group ${
        highlight
          ? 'bg-gradient-to-br from-white via-white to-blue-50/40 border-blue-200 shadow-xs ring-1 ring-blue-500/10 hover:border-blue-300'
          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm'
      }`}
    >
      {/* Top subtle blue accent indicator */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-200 ${
          highlight
            ? 'bg-blue-600 opacity-100'
            : accent === 'emerald'
            ? 'bg-emerald-500 opacity-70 group-hover:opacity-100'
            : accent === 'amber'
            ? 'bg-amber-500 opacity-70 group-hover:opacity-100'
            : 'bg-blue-500 opacity-0 group-hover:opacity-100'
        }`}
      />

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono truncate">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
              highlight
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50/60 group-hover:border-blue-100'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums truncate">
        {value}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-normal">
          {trend && (
            <span
              className={`font-semibold font-mono text-[11px] px-1.5 py-0.2 rounded-xs ${
                trendType === 'positive'
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : trendType === 'negative'
                  ? 'text-rose-700 bg-rose-50 border border-rose-200'
                  : 'text-slate-600 bg-slate-100 border border-slate-200'
              }`}
            >
              {trend}
            </span>
          )}
          {trend && subtitle && <span aria-hidden="true" className="text-slate-300">·</span>}
          {subtitle && <span className="truncate text-slate-500 text-[11px]">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
