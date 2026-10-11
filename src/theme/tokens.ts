/**
 * Official RestoSetup ERP Design System Tokens
 * Brand Hierarchy: RestoSetup (Product) by MK Innovexa (Company)
 */

export const THEME = {
  colors: {
    primary: '#0F172A',         // Deep Navy
    primaryHover: '#1E293B',    // Slate 800
    secondary: '#334155',       // Slate 700
    brand: '#0F766E',           // Teal 700 (Primary Action)
    brandHover: '#115E59',      // Teal 800
    brandBright: '#14B8A6',     // Teal 500
    brandLight: '#F0FDFA',      // Teal 50
    brandBorder: '#CCFBF1',     // Teal 100
    bg: '#F8FAFC',              // Soft Slate workspace background
    surface: '#FFFFFF',         // Card & table background
    border: '#E2E8F0',          // Slate 200 standard border
    borderInput: '#CBD5E1',     // Slate 300 input border
    text: '#0F172A',            // Deep Navy primary text
    textSecondary: '#64748B',   // Slate 500 secondary text
    textMuted: '#94A3B8',       // Slate 400 placeholder & muted text
    
    // Semantic Functional Colors
    success: '#16A34A',         // Emerald 600
    successBg: '#F0FDF4',       // Emerald 50
    successBorder: '#BBF7D0',   // Emerald 200
    
    info: '#2563EB',            // Blue 600
    infoBg: '#EFF6FF',          // Blue 50
    infoBorder: '#BFDBFE',      // Blue 200
    
    warning: '#D97706',         // Amber 600
    warningBg: '#FFFBEB',       // Amber 50
    warningBorder: '#FDE68A',   // Amber 200
    
    danger: '#DC2626',          // Red 600
    dangerBg: '#FEF2F2',        // Red 50
    dangerBorder: '#FECACA',    // Red 200
    
    special: '#7C3AED',         // Purple 600
    specialBg: '#FAF5FF',       // Purple 50
    specialBorder: '#E9D5FF'    // Purple 200
  },

  // Standardized Component Class Names
  button: {
    primary: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] active:bg-[#0F766E] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40',
    secondary: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#334155] bg-white hover:bg-[#F8FAFC] active:bg-slate-100 border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0F766E]/20',
    danger: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed',
    success: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-md transition-colors cursor-pointer'
  },

  card: 'bg-white rounded-xl border border-[#E2E8F0] shadow-xs',
  
  input: 'w-full px-3 py-2 text-xs text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg placeholder-[#94A3B8] focus:outline-hidden focus:border-[#0F766E] focus:ring-2 focus:ring-[#14B8A6]/20 transition-colors disabled:bg-slate-50 disabled:text-slate-400',
  
  label: 'block text-xs font-semibold text-[#334155] mb-1.5',
  
  table: {
    container: 'bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs',
    table: 'w-full text-left text-xs',
    header: 'bg-[#F8FAFC] text-[#334155] border-b border-[#E2E8F0] font-semibold select-none',
    headerCell: 'py-3 px-4 text-xs font-semibold text-[#334155]',
    row: 'hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0',
    cell: 'py-3 px-4 text-xs text-[#334155]'
  },

  badge: {
    active: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]',
    pending: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
    failed: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]',
    processing: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
    draft: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]',
    special: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF5FF] text-[#7C3AED] border border-[#E9D5FF]'
  }
};
