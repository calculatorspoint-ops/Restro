import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Hammer,
  Zap,
  Wind,
  Armchair,
  ChefHat,
  MonitorCheck,
  PackageSearch,
  Boxes,
  ShoppingCart,
  Users2,
  Receipt,
  FileCheck2,
  MapPin,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  History,
  Store,
  ChevronDown,
  UtensilsCrossed,
  FileText,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useAuthorization } from '../../hooks/useAuthorization';
import { BRAND } from '../../config/brand';
import { RestoSetupLogo } from '../brand/RestoSetupLogo';
import { MKInnovexaOfficialLogo } from '../brand/MKInnovexaOfficialLogo';
import { getRoleDisplayName } from '../../types';

export type NavSection =
  | 'dashboard'
  | 'branches'
  | 'projects'
  | 'construction'
  | 'electrical'
  | 'hvac'
  | 'furniture'
  | 'kitchen'
  | 'it_pos'
  | 'general_assets'
  | 'inventory'
  | 'recipes'
  | 'purchases'
  | 'suppliers'
  | 'expenses'
  | 'handover'
  | 'branded_docs'
  | 'locations'
  | 'reports'
  | 'excel'
  | 'users'
  | 'settings'
  | 'audit';

export const SECTION_TO_ROUTE: Record<NavSection, string> = {
  dashboard: '/dashboard',
  branches: '/branches',
  projects: '/projects',
  construction: '/construction',
  electrical: '/electrical',
  hvac: '/hvac',
  furniture: '/furniture',
  kitchen: '/kitchen',
  it_pos: '/it-pos',
  general_assets: '/assets',
  inventory: '/inventory',
  recipes: '/recipes',
  purchases: '/purchases',
  suppliers: '/suppliers',
  expenses: '/expenses',
  handover: '/handover',
  branded_docs: '/branded-docs',
  locations: '/locations',
  reports: '/reports',
  excel: '/excel',
  users: '/users',
  settings: '/settings',
  audit: '/audit'
};

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, switchUserRole, isSuperManager, isManager, isStaff, isMasterAdmin } = useAuth();
  const { canRoute } = useAuthorization();
  const { branches, selectedBranchId, setSelectedBranchId, alerts } = useData();

  const allNavGroups = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'branches' as NavSection, label: 'Branches', icon: Building2 },
        { id: 'projects' as NavSection, label: 'Branch Projects', icon: FolderKanban }
      ]
    },
    {
      group: 'Setup & Assets',
      items: [
        { id: 'construction' as NavSection, label: 'Construction Costing', icon: Hammer },
        { id: 'electrical' as NavSection, label: 'Electrical & Lighting', icon: Zap },
        { id: 'hvac' as NavSection, label: 'HVAC / AC Units', icon: Wind },
        { id: 'furniture' as NavSection, label: 'Furniture & Fixtures', icon: Armchair },
        { id: 'kitchen' as NavSection, label: 'Kitchen Equipment', icon: ChefHat },
        { id: 'it_pos' as NavSection, label: 'IT & POS Systems', icon: MonitorCheck },
        { id: 'general_assets' as NavSection, label: 'General Asset Register', icon: PackageSearch },
        { id: 'locations' as NavSection, label: 'Location Asset View', icon: MapPin }
      ]
    },
    {
      group: 'Operations',
      items: [
        { id: 'inventory' as NavSection, label: 'Inventory & Stock', icon: Boxes },
        { id: 'recipes' as NavSection, label: 'Recipe & Menu Costing', icon: UtensilsCrossed },
        { id: 'purchases' as NavSection, label: 'Purchase Orders', icon: ShoppingCart },
        { id: 'suppliers' as NavSection, label: 'Suppliers & Vendors', icon: Users2 },
        { id: 'expenses' as NavSection, label: 'Branch Expenses', icon: Receipt }
      ]
    },
    {
      group: 'Analytics & Tools',
      items: [
        { id: 'branded_docs' as NavSection, label: 'Branded PDF Export', icon: FileText },
        { id: 'handover' as NavSection, label: 'Branch Handover Report', icon: FileCheck2 },
        { id: 'reports' as NavSection, label: 'Executive Reports', icon: BarChart3 },
        { id: 'excel' as NavSection, label: 'Excel Center (Import/Export)', icon: FileSpreadsheet }
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'users' as NavSection, label: 'User Roles & Access', icon: ShieldCheck },
        { id: 'settings' as NavSection, label: 'System Settings', icon: Settings },
        { id: 'audit' as NavSection, label: 'Audit Trail Log', icon: History }
      ]
    }
  ];

  // Filter items and groups based on least-privilege route permissions
  const navGroups = allNavGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter((item) => {
        const itemRoute = SECTION_TO_ROUTE[item.id] || `/${item.id}`;
        return canRoute(itemRoute);
      })
    }))
    .filter((grp) => grp.items.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-64 max-w-[85vw] bg-[#0F172A] text-slate-300 border-r border-[#1E293B] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xl shadow-black/20 lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Zone: Primary RestoSetup Identity + MK Innovexa Company Attribution */}
        <div className="h-16 px-4 border-b border-[#1E293B] flex items-center justify-between shrink-0 bg-[#0F172A]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded-lg bg-[#1E293B] border border-[#334155] shadow-xs shrink-0">
              <RestoSetupLogo size={28} />
            </div>
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white block">
                  Resto<span className="text-[#14B8A6]">Setup</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-xs bg-[#134E4A] text-[#5EEAD4] border border-[#0F766E]">
                  ERP
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight block truncate">
                by {BRAND.companyName}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-[#1E293B] cursor-pointer"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Branch Selector */}
        <div className="p-3 border-b border-[#1E293B] bg-[#0F172A]/90 shrink-0">
          <label className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest block mb-1">
            Active Branch Scope
          </label>
          <div className="relative">
            <Store className="absolute left-2.5 top-2.5 w-4 h-4 text-[#14B8A6] pointer-events-none" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-medium bg-[#1E293B] border border-[#334155] rounded-lg text-slate-100 appearance-none cursor-pointer focus:outline-hidden focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/40 transition-colors shadow-xs"
            >
              {(isSuperManager || currentUser?.assignedBranchIds?.includes('all')) && (
                <option value="all" className="bg-[#0F172A] text-white">All Branches (Consolidated)</option>
              )}
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-[#0F172A] text-white">
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <div className="px-3 pb-1 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
                {grp.group}
              </div>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const itemRoute = SECTION_TO_ROUTE[item.id] || `/${item.id}`;
                  const isActive = location.pathname === itemRoute || activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(itemRoute);
                        if (onSelectSection) onSelectSection(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 min-h-[38px] text-xs rounded-lg transition-all text-left cursor-pointer active:scale-[0.99] ${
                        isActive
                          ? 'bg-[#134E4A] text-[#5EEAD4] font-semibold border-l-2 border-[#14B8A6] shadow-xs'
                          : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#5EEAD4]' : 'text-[#94A3B8]'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.id === 'inventory' && alerts.filter(a => a.module === 'Inventory').length > 0 && (
                        <span className="ml-1 text-[10px] font-mono bg-[#1E293B] text-[#D97706] border border-[#D97706]/30 px-1.5 py-0.2 rounded-xs">
                          {alerts.filter(a => a.module === 'Inventory').length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0F172A] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.name || 'Administrator'}
              </div>
              <div className="text-[11px] text-[#5EEAD4] capitalize flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]"></span>
                <span className="font-semibold">{getRoleDisplayName(currentUser?.role, isMasterAdmin)}</span>
              </div>
            </div>
          </div>

          {/* Development-Only Role Simulation (Hidden in Production) */}
          {import.meta.env.DEV && (
            <div className="pt-2 border-t border-[#1E293B]">
              <div className="text-[10px] text-slate-400 mb-1.5 flex items-center justify-between font-mono">
                <span>Role Preview:</span>
                <span className="text-amber-400 text-[9px] font-bold px-1 py-0.5 bg-amber-950/60 rounded border border-amber-800/60">DEV ONLY</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => switchUserRole('super_manager')}
                  className={`min-h-[28px] px-1 py-1 text-[10px] rounded-md font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSuperManager ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-[#1E293B] text-slate-300 hover:text-white border border-[#334155] hover:bg-[#334155]'
                  }`}
                  title="Super Manager (Full system access & settings)"
                >
                  Super Mgr
                </button>
                <button
                  type="button"
                  onClick={() => switchUserRole('manager')}
                  className={`min-h-[28px] px-1 py-1 text-[10px] rounded-md font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isManager && !isSuperManager ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-[#1E293B] text-slate-300 hover:text-white border border-[#334155] hover:bg-[#334155]'
                  }`}
                  title="Manager (Branch operations, costing, assets)"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => switchUserRole('staff')}
                  className={`min-h-[28px] px-1 py-1 text-[10px] rounded-md font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isStaff ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-[#1E293B] text-slate-300 hover:text-white border border-[#334155] hover:bg-[#334155]'
                  }`}
                  title="Staff (Stock entries, operational logging & read-only)"
                >
                  Staff
                </button>
              </div>
            </div>
          )}

          {/* Powered by MK Innovexa & Version */}
          <div className="pt-2.5 pb-0.5 border-t border-[#1E293B] flex items-center justify-between select-none">
            <div className="flex items-center gap-1.5">
              <MKInnovexaOfficialLogo variant="monogram" size="sm" theme="dark" />
              <div className="text-[10px] text-slate-400 leading-tight">
                <span className="block font-medium text-slate-300">{BRAND.companyName}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {BRAND.version}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
