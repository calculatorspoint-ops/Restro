import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ChefHat,
  Boxes,
  Menu
} from 'lucide-react';
import { NavSection, SECTION_TO_ROUTE } from './Sidebar';

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
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (section: NavSection) => {
    navigate(SECTION_TO_ROUTE[section] || `/${section}`);
    if (onSelectSection) onSelectSection(section);
  };

  const isCurrent = (section: NavSection) => {
    return location.pathname === SECTION_TO_ROUTE[section] || activeSection === section;
  };

  const isAssetsActive = [
    'construction',
    'electrical',
    'hvac',
    'furniture',
    'kitchen',
    'it_pos',
    'general_assets',
    'locations'
  ].some((sec) => location.pathname === SECTION_TO_ROUTE[sec as NavSection] || activeSection === sec);

  const isOpsActive = [
    'inventory',
    'recipes',
    'purchases',
    'suppliers',
    'expenses'
  ].some((sec) => location.pathname === SECTION_TO_ROUTE[sec as NavSection] || activeSection === sec);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden shadow-lg safe-area-bottom select-none"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto px-1">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] active:scale-95 cursor-pointer ${
            isCurrent('dashboard')
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Dashboard"
        >
          <LayoutDashboard className={`w-5 h-5 ${isCurrent('dashboard') ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none">Home</span>
        </button>

        {/* 2. Branches */}
        <button
          type="button"
          onClick={() => handleNav('branches')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] active:scale-95 cursor-pointer ${
            isCurrent('branches')
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Branches"
        >
          <Building2 className={`w-5 h-5 ${isCurrent('branches') ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none">Branches</span>
        </button>

        {/* 3. Assets Quick Hub */}
        <button
          type="button"
          onClick={() => handleNav('kitchen')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] active:scale-95 cursor-pointer ${
            isAssetsActive
              ? 'text-blue-600 font-bold'
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
          onClick={() => handleNav('inventory')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] active:scale-95 cursor-pointer ${
            isOpsActive
              ? 'text-blue-600 font-bold'
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
          className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors min-h-[48px] active:scale-95 cursor-pointer"
          aria-label="Open Full Menu Drawer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-none">More</span>
        </button>
      </div>
    </nav>
  );
};
