import React from 'react';
import {
  LayoutDashboard,
  Building2,
  ChefHat,
  Boxes,
  Menu
} from 'lucide-react';
import { NavSection } from './Sidebar';

interface MobileBottomNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  onSelectSection,
  onOpenMenu
}) => {
  const isAssetsActive = [
    'construction',
    'electrical',
    'hvac',
    'furniture',
    'kitchen',
    'it_pos',
    'general_assets',
    'locations'
  ].includes(activeSection);

  const isOpsActive = [
    'inventory',
    'recipes',
    'purchases',
    'suppliers',
    'expenses'
  ].includes(activeSection);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden shadow-lg safe-area-bottom select-none"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto px-1">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectSection('dashboard')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] active:scale-95 ${
            activeSection === 'dashboard'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Dashboard"
        >
          <LayoutDashboard className={`w-5 h-5 ${activeSection === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none">Home</span>
        </button>

        {/* 2. Branches */}
        <button
          type="button"
          onClick={() => onSelectSection('branches')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] active:scale-95 ${
            activeSection === 'branches'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Branches"
        >
          <Building2 className={`w-5 h-5 ${activeSection === 'branches' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none">Branches</span>
        </button>

        {/* 3. Assets Quick Hub */}
        <button
          type="button"
          onClick={() => onSelectSection('kitchen')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] active:scale-95 ${
            isAssetsActive
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Kitchen and Assets"
        >
          <ChefHat className={`w-5 h-5 ${isAssetsActive ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none">Assets</span>
        </button>

        {/* 4. Operations (Inventory/Purchases) */}
        <button
          type="button"
          onClick={() => onSelectSection('inventory')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] active:scale-95 ${
            isOpsActive
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Operations & Stock"
        >
          <Boxes className={`w-5 h-5 ${isOpsActive ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none">Ops</span>
        </button>

        {/* 5. More (All 22 Modules Drawer) */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-900 transition-colors min-h-[48px] active:scale-95"
          aria-label="Open Full Menu Drawer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-none">More</span>
        </button>
      </div>
    </nav>
  );
};
