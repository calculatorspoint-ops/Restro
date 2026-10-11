import React from 'react';

interface RestoSetupLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showText?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
  subtitle?: string;
}

export const RestoSetupLogo: React.FC<RestoSetupLogoProps> = ({
  size = 'md',
  showText = false,
  theme = 'dark',
  className = '',
  subtitle = 'Branch Setup & Asset ERP'
}) => {
  const pixelSize = typeof size === 'number'
    ? size
    : {
        sm: 36,
        md: 48,
        lg: 64,
        xl: 88,
        '2xl': 120
      }[size];

  const isDark = theme === 'dark';

  const logoMark = (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300"
      aria-label="RestoSetup Logo"
    >
      <rect width="120" height="120" rx="24" fill="#0C1322" />
      <rect
        x="1"
        y="1"
        width="118"
        height="118"
        rx="23"
        stroke="#D4AF37"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <path
        d="M24 24L96 24M24 96L96 96M24 24L24 96M96 24L96 96"
        stroke="#38BDF8"
        strokeOpacity="0.15"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <path
        d="M38 88V32H62C72 32 79 38 79 47C79 55 73 60 64 62L82 88H68L52 64H50V88H38ZM50 54H61C66 54 68 52 68 47C68 43 65 41 60 41H50V54Z"
        fill="url(#restoGoldGradient)"
      />
      <path
        d="M68 38L86 28L92 38"
        stroke="#D4AF37"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="86" cy="28" r="3" fill="#38BDF8" />
      <circle cx="38" cy="88" r="2.5" fill="#D4AF37" />
      <circle cx="82" cy="88" r="2.5" fill="#D4AF37" />
      <path
        d="M28 60H92"
        stroke="#D4AF37"
        strokeOpacity="0.2"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <defs>
        <linearGradient
          id="restoGoldGradient"
          x1="38"
          y1="32"
          x2="82"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FCEBA7" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA8018" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (!showText) {
    return <div className={`inline-flex items-center ${className}`}>{logoMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {logoMark}
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span
            className={`font-extrabold tracking-tight font-sans text-xl ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Resto<span className="text-[#D4AF37]">Setup</span>
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            ERP
          </span>
        </div>
        <p
          className={`text-xs mt-0.5 font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
};
