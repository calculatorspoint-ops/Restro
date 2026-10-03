import React from 'react';
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
import { BRAND } from '../../config/brand';
import { MKInnovexaLogo } from '../brand/MKInnovexaLogo';

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
  const { currentUser, switchUserRole, isSuperAdmin, isStaff } = useAuth();
  const { branches, selectedBranchId, setSelectedBranchId, settings, alerts } = useData();

  const navGroups = [
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
        ...(!isStaff ? [{ id: 'users' as NavSection, label: 'User Roles & Access', icon: ShieldCheck }] : []),
        ...(!isStaff ? [{ id: 'settings' as NavSection, label: 'System Settings', icon: Settings }] : []),
        { id: 'audit' as NavSection, label: 'Audit Trail Log', icon: History }
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-64 max-w-[85vw] bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Zone: Parent MK Innovexa & Product RestoSetup */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <MKInnovexaLogo variant="monogram" theme="dark" size="sm" />
            <div className="leading-tight">
              <span className="text-xs font-bold tracking-tight text-white uppercase block">
                {BRAND.companyName}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-0.5">
                <span className="text-emerald-400 font-semibold">{BRAND.productShortName}</span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-[10px] text-slate-400">ERP</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded-xs font-mono font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 hidden sm:inline-block">
              ENTERPRISE
            </span>
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg active:bg-slate-800"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Branch Selector */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Active Branch Focus
          </label>
          <div className="relative">
            <Store className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-800 border border-slate-700 rounded-md text-white appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Branches (Consolidated)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {grp.group}
              </div>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[42px] text-xs font-medium rounded-lg transition-colors text-left active:scale-[0.99] ${
                        isActive
                          ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70 active:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.id === 'inventory' && alerts.filter(a => a.module === 'Inventory').length > 0 && (
                        <span className="ml-1 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-xs">
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
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.name || 'Administrator'}
              </div>
              <div className="text-[11px] text-emerald-400 capitalize flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{currentUser?.role?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Quick role test switch */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
              <span>Quick Test Role:</span>
              <span className="font-mono text-slate-500">Live Auth</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => switchUserRole('super_admin')}
                className={`min-h-[38px] px-2 py-1 text-[11px] rounded-md font-semibold transition-colors flex items-center justify-center ${
                  isSuperAdmin ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white active:bg-slate-700'
                }`}
              >
                SuperAdmin
              </button>
              <button
                type="button"
                onClick={() => switchUserRole('admin')}
                className={`min-h-[38px] px-2 py-1 text-[11px] rounded-md font-semibold transition-colors flex items-center justify-center ${
                  currentUser?.role === 'admin' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white active:bg-slate-700'
                }`}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => switchUserRole('staff')}
                className={`min-h-[38px] px-2 py-1 text-[11px] rounded-md font-semibold transition-colors flex items-center justify-center ${
                  isStaff ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white active:bg-slate-700'
                }`}
              >
                Staff
              </button>
            </div>
          </div>

          {/* Powered by MK Innovexa & Version */}
          <div className="pt-2.5 pb-1 border-t border-slate-800/80 text-center select-none">
            <div className="text-[10px] text-slate-400 font-medium">
              {BRAND.poweredByNotice}
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
              {BRAND.version}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
