import React from 'react';

interface MKInnovexaOfficialLogoProps {
  variant?: 'full' | 'badge' | 'footer' | 'monogram';
  theme?: 'dark' | 'light';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MKInnovexaOfficialLogo: React.FC<MKInnovexaOfficialLogoProps> = ({
  variant = 'badge',
  theme = 'dark',
  className = '',
  size = 'md'
}) => {
  const isDark = theme === 'dark';

  const dims = {
    sm: { height: 28, text: 'text-xs', sub: 'text-[9px]', tag: 'text-[8px]' },
    md: { height: 38, text: 'text-sm', sub: 'text-[10px]', tag: 'text-[9px]' },
    lg: { height: 50, text: 'text-base', sub: 'text-xs', tag: 'text-[11px]' }
  }[size];

  // Vector mark for MK with organic details
  const vectorMark = (
    <svg
      width={dims.height * 1.5}
      height={dims.height}
      viewBox="0 0 240 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
      aria-label="MK Innovexa Monogram"
    >
      <defs>
        <linearGradient id="mkOfficialTeal" x1="20" y1="20" x2="140" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="35%" stopColor="#06B6D4" />
          <stop offset="70%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="mkOfficialGreen" x1="140" y1="20" x2="220" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="60%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
        <linearGradient id="mkOfficialTag" x1="10" y1="125" x2="230" y2="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="40%" stopColor="#0D9488" />
          <stop offset="80%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>

      {/* Letter 'm' */}
      <path
        d="M 24 104 L 24 38 C 24 28 32 20 42 20 C 52 20 58 26 58 36 L 58 44 C 64 30 74 20 88 20 C 98 20 106 28 110 38 C 116 28 126 20 138 20 C 150 20 158 28 158 42 L 158 104 C 158 108 154 112 150 112 L 136 112 C 132 112 128 108 128 104 L 128 54 C 128 46 124 40 116 40 C 108 40 104 46 104 54 L 104 104 C 104 108 100 112 96 112 L 82 112 C 78 112 74 108 74 104 L 74 54 C 74 46 70 40 62 40 C 54 40 50 46 50 54 L 50 104 C 50 108 46 112 42 112 L 28 112 C 24 112 24 108 24 104 Z"
        fill="url(#mkOfficialTeal)"
      />

      {/* Birds detail in upper 'm' */}
      <path d="M 32 30 Q 35 27 38 30 Q 41 27 44 30" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.65" />
      <path d="M 38 36 Q 40 34 42 36 Q 44 34 46 36" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.55" />
      {/* Palm leaf silhouette in lower 'm' */}
      <path d="M 26 102 Q 32 90 38 96 M 32 92 Q 26 88 24 82 M 33 89 Q 40 84 42 78" stroke="#042f2e" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.4" />

      {/* Letter 'k' */}
      <g transform="translate(156, 0)">
        <path
          d="M 12 112 C 6 112 2 108 2 102 L 2 24 C 2 16 8 10 16 10 L 30 10 C 36 10 40 14 40 20 L 40 102 C 40 108 36 112 30 112 Z"
          fill="url(#mkOfficialGreen)"
        />
        <path
          d="M 34 66 C 40 54 54 38 72 32 C 84 28 94 32 94 44 C 94 52 88 58 78 62 C 62 68 48 80 42 92 L 34 66 Z"
          fill="url(#mkOfficialGreen)"
        />
        <path
          d="M 38 80 C 46 74 58 74 68 82 L 88 102 C 94 108 100 112 108 112 C 110 112 112 112 112 114 L 112 116 C 112 120 108 124 102 124 C 92 124 84 118 76 110 L 58 92 C 50 84 42 84 38 88 Z"
          fill="url(#mkOfficialGreen)"
        />
        {/* Mountain silhouette in 'k' base */}
        <path d="M 64 110 L 72 98 L 80 110 Z" fill="#064e3b" opacity="0.4" />
      </g>

      {/* Official Slogan */}
      <text
        x="120"
        y="136"
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
        fontSize="12.5"
        fontWeight="800"
        fill="url(#mkOfficialTag)"
        letterSpacing="2.8"
      >
        INNOVATE. AUTOMATE. GROW.
      </text>
    </svg>
  );

  if (variant === 'monogram') {
    return <div className={`inline-flex items-center ${className}`}>{vectorMark}</div>;
  }

  if (variant === 'footer') {
    return (
      <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <div className="flex items-center gap-3">
          {vectorMark}
          <div className="text-left">
            <span
              className={`font-extrabold tracking-tight block ${dims.text} ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              MK INNOVEXA
            </span>
            <span
              className={`block font-medium ${dims.sub} ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Enterprise Software Solutions
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Badge or full variant
  return (
    <div
      className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-xl ${
        isDark
          ? 'bg-slate-900/80 border border-slate-800 backdrop-blur-xs'
          : 'bg-white border border-slate-200/80 shadow-xs'
      } ${className}`}
    >
      {vectorMark}
      <div className="text-left leading-tight pr-1">
        <span
          className={`font-extrabold tracking-tight block ${dims.text} ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          MK INNOVEXA
        </span>
        <span
          className={`block font-mono tracking-wider uppercase ${dims.sub} ${
            isDark ? 'text-emerald-400/90' : 'text-emerald-700'
          }`}
        >
          Technology Partner
        </span>
      </div>
    </div>
  );
};
