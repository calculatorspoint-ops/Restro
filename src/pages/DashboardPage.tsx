import React, { useMemo } from 'react';
import {
  Building2,
  PackageSearch,
  Boxes,
  Calculator,
  Hammer,
  Zap,
  Wind,
  Armchair,
  ChefHat,
  MonitorCheck,
  Receipt,
  ShoppingCart,
  ArrowUpRight,
  Filter,
  BarChart3,
  Layers,
  FileCheck2,
  ShieldCheck,
  Users,
  Settings,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { MetricCard } from '../components/common/MetricCard';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { BRAND } from '../config/brand';
import { RestoSetupLogo } from '../components/brand/RestoSetupLogo';

interface DashboardPageProps {
  onNavigate: (section: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser, isSuperManager } = useAuth();
  const {
    branches,
    projects,
    assets,
    inventory,
    constructionCosts,
    purchases,
    expenses,
    selectedBranchId,
    setSelectedBranchId,
    settings,
    getBranchCostBreakdown,
    reloadState,
    resetDemoData
  } = useData();

  const hasGlobalBranchAccess = useMemo(() => {
    if (!currentUser) return false;
    return isSuperManager || (currentUser.assignedBranchIds && currentUser.assignedBranchIds.includes('all'));
  }, [currentUser, isSuperManager]);

  // Filter items by branch
  const activeBranchProjects = useMemo(() => {
    return selectedBranchId === 'all'
      ? projects
      : projects.filter(p => p.branchId === selectedBranchId);
  }, [projects, selectedBranchId]);

  const activeConstruction = useMemo(() => {
    return selectedBranchId === 'all'
      ? constructionCosts
      : constructionCosts.filter(c => c.branchId === selectedBranchId);
  }, [constructionCosts, selectedBranchId]);

  const activeAssets = useMemo(() => {
    return selectedBranchId === 'all'
      ? assets
      : assets.filter(a => a.branchId === selectedBranchId);
  }, [assets, selectedBranchId]);

  const activePurchases = useMemo(() => {
    return selectedBranchId === 'all'
      ? purchases
      : purchases.filter(p => p.branchId === selectedBranchId);
  }, [purchases, selectedBranchId]);

  const activeExpenses = useMemo(() => {
    return selectedBranchId === 'all'
      ? expenses
      : expenses.filter(e => e.branchId === selectedBranchId);
  }, [expenses, selectedBranchId]);

  const activeInventory = useMemo(() => {
    return selectedBranchId === 'all'
      ? inventory
      : inventory.filter(i => i.branchId === selectedBranchId);
  }, [inventory, selectedBranchId]);

  // Aggregate Category Totals
  const totalConstructionCost = useMemo(() => {
    return activeConstruction.reduce((sum, c) => sum + (Number(c.totalCost) || 0), 0);
  }, [activeConstruction]);

  const sumAssetCategory = (category: string) => {
    return activeAssets
      .filter(a => a.category === category)
      .reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
  };

  const totalElectricalCost = sumAssetCategory('electrical');
  const totalLightingCost = sumAssetCategory('lighting');
  const totalHvacCost = sumAssetCategory('hvac');
  const totalFurnitureCost = sumAssetCategory('furniture');
  const totalKitchenCost = sumAssetCategory('kitchen');
  const totalItPosCost = sumAssetCategory('it_pos');
  const totalGeneralAssetCost = sumAssetCategory('general');

  const totalAllAssetsValue = activeAssets.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
  const totalPurchasesCost = activePurchases.reduce((sum, p) => sum + (Number(p.grandTotal) || 0), 0);
  const totalExpensesCost = activeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalInventoryValue = activeInventory.reduce((sum, i) => sum + (Number(i.stockValue) || 0), 0);

  // Total Setup Cost = Construction + All Assets + Setup Expenses
  const totalProjectSetupCost = totalConstructionCost + totalAllAssetsValue + totalExpensesCost;

  // Active branches count
  const activeBranchesCount = branches.filter(b => b.status === 'Operational' || b.status === 'Setup in Progress').length;

  // Currently active branch object (if specific branch selected)
  const currentBranch = useMemo(() => {
    return branches.find(b => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Category breakdown array for visual progress bars with professional enterprise blue & navy styling
  const costBreakdownList = [
    { label: 'Construction & Civil', amount: totalConstructionCost, icon: Hammer, color: 'bg-blue-600', nav: 'construction' },
    { label: 'Kitchen Equipment', amount: totalKitchenCost, icon: ChefHat, color: 'bg-blue-500', nav: 'kitchen' },
    { label: 'HVAC & Air Conditioning', amount: totalHvacCost, icon: Wind, color: 'bg-sky-600', nav: 'hvac' },
    { label: 'Furniture & Fixtures', amount: totalFurnitureCost, icon: Armchair, color: 'bg-indigo-600', nav: 'furniture' },
    { label: 'Electrical Infrastructure', amount: totalElectricalCost, icon: Zap, color: 'bg-blue-700', nav: 'electrical' },
    { label: 'Lighting Fixtures', amount: totalLightingCost, icon: Zap, color: 'bg-sky-500', nav: 'electrical' },
    { label: 'IT & POS Systems', amount: totalItPosCost, icon: MonitorCheck, color: 'bg-blue-800', nav: 'it_pos' },
    { label: 'General Operational Expenses', amount: totalExpensesCost, icon: Receipt, color: 'bg-slate-400', nav: 'expenses' }
  ];

  const maxCategoryAmount = Math.max(...costBreakdownList.map(c => c.amount), 1);

  // High-level capital macro-allocation (Civil vs Equipment vs Fixtures vs Operational)
  const macroAllocation = useMemo(() => {
    const total = totalProjectSetupCost || 1;
    const civil = (totalConstructionCost / total) * 100;
    const kitchenHvac = ((totalKitchenCost + totalHvacCost) / total) * 100;
    const interiorIt = ((totalFurnitureCost + totalLightingCost + totalElectricalCost + totalItPosCost) / total) * 100;
    const ops = (totalExpensesCost / total) * 100;
    return { civil, kitchenHvac, interiorIt, ops };
  }, [totalProjectSetupCost, totalConstructionCost, totalKitchenCost, totalHvacCost, totalFurnitureCost, totalLightingCost, totalElectricalCost, totalItPosCost, totalExpensesCost]);

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Brand Identity Hero */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Brand Focal Mark + Title + Subtitle */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-1 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
              <RestoSetupLogo size={42} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Resto<span className="text-blue-600">Setup</span> ERP
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  Enterprise Suite
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Cloud Database Synced
                </span>
                {isSuperManager && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    Super Manager (Full Access)
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Welcome back, <strong className="text-slate-900 font-semibold">{currentUser?.name || 'Administrator'}</strong>
                {isSuperManager && (
                  <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    <ShieldCheck className="w-3 h-3 text-purple-700" /> Super Manager
                  </span>
                )}. Real-time multi-branch capital expenditure, construction costing, equipment inventory, and asset management.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 font-mono">
                <span>Scope: <strong className="text-blue-700 font-semibold">{selectedBranchId === 'all' ? 'Consolidated All Branches' : `${currentBranch?.code} - ${currentBranch?.name}`}</strong></span>
                <span>·</span>
                <span>Active Projects: <strong className="text-slate-800 font-medium">{activeBranchProjects.length}</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Shortcuts */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={() => onNavigate('handover')}
              className="min-h-[38px] px-3.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:bg-blue-800"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Handover Report</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="min-h-[38px] px-3.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:bg-slate-100"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Executive Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Super Manager Executive Command Suite */}
      {isSuperManager && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-purple-800/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 shrink-0">
                <ShieldCheck className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    Super Manager Command Suite
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Universal Multi-Branch Authority
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Full control over user accounts, role delegations, organizational settings, branch setups, and audit trails.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <button
                onClick={() => onNavigate('users')}
                className="min-h-[34px] px-3 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:bg-white/25"
                title="Manage users, assign roles and branch scopes"
              >
                <Users className="w-3.5 h-3.5 text-purple-300" />
                <span>User Roles</span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="min-h-[34px] px-3 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:bg-white/25"
                title="Organizational settings & tax rates"
              >
                <Settings className="w-3.5 h-3.5 text-purple-300" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => onNavigate('branches')}
                className="min-h-[34px] px-3 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:bg-white/25"
                title="Branch management and new location setup"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-300" />
                <span>Branches</span>
              </button>
              <button
                onClick={() => onNavigate('audit')}
                className="min-h-[34px] px-3 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:bg-white/25"
                title="System audit trail log"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
                <span>Audit Log</span>
              </button>
              <button
                onClick={() => reloadState(true)}
                className="min-h-[34px] px-3 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:bg-purple-700"
                title="Force refresh data directly from Cloud Firestore"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Force Sync</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Database Initial Seed Prompt for Super Manager */}
      {branches.length === 0 && isSuperManager && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center my-4 shadow-xs">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Multi-Branch Database Initial Setup</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Welcome Super Manager. Your branch list is currently empty. Click below to initialize the standard multi-branch restaurant dataset (DHA Phase 6, Gulberg III, Bahria Town, Islamabad) directly into Cloud Firestore.
            </p>
            <button
              onClick={async () => {
                await resetDemoData();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              Seed Initial Multi-Branch Dataset
            </button>
          </div>
        </div>
      )}

      {/* Scope Filter Bar (Segmented Controls) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto touch-scroll pb-1 sm:pb-0 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 font-mono shrink-0 uppercase tracking-wider">
            Branch Scope:
          </span>
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/70 rounded-lg shrink-0">
            {hasGlobalBranchAccess && (
              <button
                onClick={() => setSelectedBranchId('all')}
                className={`min-h-[32px] px-3.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedBranchId === 'all'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                All Branches (Consolidated)
              </button>
            )}
            {branches.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`min-h-[32px] px-3.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedBranchId === b.id
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {b.code}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Branch Status info */}
        {currentBranch && selectedBranchId !== 'all' && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 shrink-0">
            <span>{currentBranch.city}</span>
            <span>·</span>
            <span className="text-slate-700 font-semibold">{currentBranch.branchManager ? `Mgr: ${currentBranch.branchManager}` : currentBranch.province}</span>
            <span>·</span>
            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
              currentBranch.status === 'Operational'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {currentBranch.status}
            </span>
          </div>
        )}

        {selectedBranchId === 'all' && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 shrink-0">
            <span>Portfolio: <strong className="text-slate-900">{branches.length}</strong> Locations</span>
            <span>·</span>
            <span className="text-blue-700 font-semibold">{activeBranchesCount} Active</span>
          </div>
        )}
      </div>

      {/* Primary Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Setup & Project Cost"
          value={formatCurrency(totalProjectSetupCost, settings.currencySymbol)}
          subtitle="Civil + Assets + Site Costs"
          icon={Calculator}
          highlight={true}
          accent="blue"
        />
        <MetricCard
          title="Total Restaurant Assets"
          value={formatNumber(activeAssets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0))}
          subtitle={`${activeAssets.length} asset line items registered`}
          icon={PackageSearch}
          accent="blue"
        />
        <MetricCard
          title="Building Construction Cost"
          value={formatCurrency(totalConstructionCost, settings.currencySymbol)}
          subtitle={`${activeConstruction.length} contractor milestones`}
          icon={Hammer}
          accent="blue"
        />
        <MetricCard
          title="Branch Network Overview"
          value={`${activeBranchesCount} Active / ${branches.length} Total`}
          subtitle="Multi-branch network footprint"
          icon={Building2}
          accent="blue"
        />
      </div>

      {/* Macro Capital Allocation Overview Strip */}
      <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
              Capital Distribution Profile
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Aggregated Total: <strong className="text-slate-900">{formatCurrency(totalProjectSetupCost, settings.currencySymbol)}</strong>
          </span>
        </div>

        {/* Visual Multi-Segment Strip */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 p-0.5 gap-0.5">
          <div
            title={`Civil & Construction: ${macroAllocation.civil.toFixed(1)}%`}
            className="h-full bg-blue-600 rounded-l-full transition-all duration-300"
            style={{ width: `${Math.max(macroAllocation.civil, 2)}%` }}
          />
          <div
            title={`Kitchen & HVAC Equipment: ${macroAllocation.kitchenHvac.toFixed(1)}%`}
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${Math.max(macroAllocation.kitchenHvac, 2)}%` }}
          />
          <div
            title={`Interior Fixtures & IT: ${macroAllocation.interiorIt.toFixed(1)}%`}
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${Math.max(macroAllocation.interiorIt, 2)}%` }}
          />
          <div
            title={`Operational Expenses: ${macroAllocation.ops.toFixed(1)}%`}
            className="h-full bg-slate-300 rounded-r-full transition-all duration-300"
            style={{ width: `${Math.max(macroAllocation.ops, 2)}%` }}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
            <span className="text-slate-500">Civil & Civil Works:</span>
            <span className="text-blue-900 font-bold">{macroAllocation.civil.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" />
            <span className="text-slate-500">Kitchen & HVAC:</span>
            <span className="text-blue-900 font-bold">{macroAllocation.kitchenHvac.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" />
            <span className="text-slate-500">Fixtures & IT:</span>
            <span className="text-blue-900 font-bold">{macroAllocation.interiorIt.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-300" />
            <span className="text-slate-500">Operational Exp:</span>
            <span className="text-slate-700 font-bold">{macroAllocation.ops.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Secondary Cost Categorization Cards */}
      <div>
        <h2 className="text-xs font-mono font-semibold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span>Equipment & Asset Cost Breakdown</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => onNavigate('kitchen')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer transition-all duration-150 group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold group-hover:text-blue-700 transition-colors">Kitchen</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ChefHat className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono tabular-nums text-slate-900 group-hover:text-blue-700 transition-colors">
              {formatCurrency(totalKitchenCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('hvac')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer transition-all duration-150 group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold group-hover:text-blue-700 transition-colors">HVAC / AC</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Wind className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono tabular-nums text-slate-900 group-hover:text-blue-700 transition-colors">
              {formatCurrency(totalHvacCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('furniture')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer transition-all duration-150 group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold group-hover:text-blue-700 transition-colors">Furniture</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Armchair className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono tabular-nums text-slate-900 group-hover:text-blue-700 transition-colors">
              {formatCurrency(totalFurnitureCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('electrical')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer transition-all duration-150 group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold group-hover:text-blue-700 transition-colors">Electrical</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono tabular-nums text-slate-900 group-hover:text-blue-700 transition-colors">
              {formatCurrency(totalElectricalCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('electrical')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer transition-all duration-150 group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold group-hover:text-blue-700 transition-colors">Lighting</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono tabular-nums text-slate-900 group-hover:text-blue-700 transition-colors">
              {formatCurrency(totalLightingCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('it_pos')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer transition-all duration-150 group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold group-hover:text-blue-700 transition-colors">IT & POS</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <MonitorCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono tabular-nums text-slate-900 group-hover:text-blue-700 transition-colors">
              {formatCurrency(totalItPosCost, settings.currencySymbol)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category Visual Bars */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Cost Allocation by Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time capital distribution for {selectedBranchId === 'all' ? 'all branches' : 'selected branch'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 self-start sm:self-auto">
              Total: {formatCurrency(totalProjectSetupCost, settings.currencySymbol)}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {costBreakdownList.map((item) => {
              const pct = totalProjectSetupCost > 0 ? (item.amount / totalProjectSetupCost) * 100 : 0;
              const barWidth = maxCategoryAmount > 0 ? (item.amount / maxCategoryAmount) * 100 : 0;
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  onClick={() => onNavigate(item.nav)}
                  className="group cursor-pointer p-2.5 rounded-xl hover:bg-blue-50/40 border border-transparent hover:border-blue-100 transition-all"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 rounded-md bg-slate-50 border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <span className="font-semibold text-slate-700 group-hover:text-blue-800 transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-slate-900 font-bold group-hover:text-blue-700 transition-colors">
                        {formatCurrency(item.amount, settings.currencySymbol)}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px] w-14 text-right">
                        ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.max(barWidth, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Branch Setup Comparison & Budget Variance */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Branch Budget vs. Actual
              </h3>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 font-mono transition-colors cursor-pointer"
              >
                View Projects →
              </button>
            </div>

            <div className="space-y-3">
              {branches.map(b => {
                const breakdown = getBranchCostBreakdown(b.id);
                const percentSpent = breakdown.estimatedBudget > 0
                  ? Math.min((breakdown.totalActual / breakdown.estimatedBudget) * 100, 100)
                  : 0;

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBranchId(b.id);
                      onNavigate('handover');
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/20 hover:border-blue-300 cursor-pointer transition-all group shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{b.name}</span>
                      <span className="text-[10px] text-blue-700 font-mono bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-xs">
                        {b.code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-2">
                      <span>Spent: <strong className="text-slate-900">{formatCurrency(breakdown.totalActual, settings.currencySymbol)}</strong></span>
                      <span>Budget: {formatCurrency(breakdown.estimatedBudget, settings.currencySymbol)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2 border border-slate-200/80">
                      <div
                        className={`h-full ${
                          breakdown.isOverBudget
                            ? 'bg-rose-500'
                            : percentSpent > 80
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(percentSpent, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">
                        Status: <strong className="text-slate-700">{b.status}</strong>
                      </span>
                      <span
                        className={`font-semibold ${
                          breakdown.isOverBudget ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {breakdown.isOverBudget
                          ? `Over by ${formatCurrency(Math.abs(breakdown.remainingBudget), settings.currencySymbol)}`
                          : `Remaining: ${formatCurrency(breakdown.remainingBudget, settings.currencySymbol)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-mono">
            <span>Automated calculations active</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live DB Synced
            </span>
          </div>
        </div>
      </div>

      {/* Operations & Inventory Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Inventory Status Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
                <Boxes className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Inventory Status</h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-blue-600 hover:text-blue-700 font-mono font-semibold transition-colors cursor-pointer"
            >
              Open Inventory →
            </button>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Total Tracked Items</span>
              <span className="font-mono font-bold text-slate-900">{activeInventory.length} SKU</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Total Inventory Valuation</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(totalInventoryValue, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Low Stock Alerts</span>
              <span className="font-mono font-bold text-amber-600">
                {activeInventory.filter(i => i.currentStock <= i.minimumLevel).length} Items
              </span>
            </div>
          </div>
        </div>

        {/* Purchases Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Purchase Orders</h3>
            </div>
            <button
              onClick={() => onNavigate('purchases')}
              className="text-xs text-blue-600 hover:text-blue-700 font-mono font-semibold transition-colors cursor-pointer"
            >
              View POs →
            </button>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Total Orders Placed</span>
              <span className="font-mono font-bold text-slate-900">{activePurchases.length} Orders</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Total Purchase Value</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(totalPurchasesCost, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Delivery Received</span>
              <span className="font-mono font-bold text-emerald-600">
                {activePurchases.filter(p => p.deliveryStatus === 'Received').length} / {activePurchases.length}
              </span>
            </div>
          </div>
        </div>

        {/* Expenses Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Operational Expenses</h3>
            </div>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs text-blue-600 hover:text-blue-700 font-mono font-semibold transition-colors cursor-pointer"
            >
              View Expenses →
            </button>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Total Expense Vouchers</span>
              <span className="font-mono font-bold text-slate-900">{activeExpenses.length} Records</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Total Expenses Logged</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(totalExpensesCost, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Largest Category</span>
              <span className="font-semibold text-slate-800">Utilities & Labour</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
