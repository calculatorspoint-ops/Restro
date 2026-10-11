import React from 'react';

export const SkeletonRow: React.FC<{ columns?: number }> = ({ columns = 6 }) => {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-3">
          <div
            className="h-3.5 bg-slate-200 rounded-sm"
            style={{ width: `${Math.max(40, 90 - (i % 3) * 20)}%` }}
          />
        </td>
      ))}
    </tr>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6
}) => {
  return (
    <div className="w-full overflow-hidden border border-slate-200 rounded-lg bg-white p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded-sm w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-9 bg-slate-100 rounded-md w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-4 rounded-lg border border-slate-200 bg-white animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-slate-200 rounded-sm w-1/3" />
        <div className="w-6 h-6 rounded-md bg-slate-100" />
      </div>
      <div className="h-6 bg-slate-200 rounded-sm w-1/2" />
      <div className="h-2.5 bg-slate-100 rounded-sm w-2/3" />
    </div>
  );
};
