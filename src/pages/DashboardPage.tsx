import React, { useState, useMemo } from 'react';
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
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { MetricCard } from '../components/common/MetricCard';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { BRAND } from '../config/brand';

interface DashboardPageProps {
  onNavigate: (section: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
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
    alerts,
    getBranchCostBreakdown
  } = useData();

  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | 'year'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  // Category breakdown array for visual progress bars
  const costBreakdownList = [
    { label: 'Construction & Civil', amount: totalConstructionCost, icon: Hammer, color: 'bg-amber-600', nav: 'construction' },
    { label: 'Kitchen Equipment', amount: totalKitchenCost, icon: ChefHat, color: 'bg-emerald-600', nav: 'kitchen' },
    { label: 'HVAC & Air Conditioning', amount: totalHvacCost, icon: Wind, color: 'bg-sky-600', nav: 'hvac' },
    { label: 'Furniture & Fixtures', amount: totalFurnitureCost, icon: Armchair, color: 'bg-indigo-600', nav: 'furniture' },
    { label: 'Electrical Infrastructure', amount: totalElectricalCost, icon: Zap, color: 'bg-yellow-600', nav: 'electrical' },
    { label: 'Lighting Fixtures', amount: totalLightingCost, icon: Zap, color: 'bg-orange-500', nav: 'electrical' },
    { label: 'IT & POS Systems', amount: totalItPosCost, icon: MonitorCheck, color: 'bg-purple-600', nav: 'it_pos' },
    { label: 'General Operational Expenses', amount: totalExpensesCost, icon: Receipt, color: 'bg-slate-600', nav: 'expenses' }
  ];

  const maxCategoryAmount = Math.max(...costBreakdownList.map(c => c.amount), 1);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto touch-scroll pb-1 sm:pb-0 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 shrink-0">Scope:</span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setSelectedBranchId('all')}
              className={`min-h-[34px] px-3 text-xs font-semibold rounded-md transition-colors ${
                selectedBranchId === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Branches
            </button>
            {branches.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`min-h-[34px] px-3 text-xs font-semibold rounded-md transition-colors ${
                  selectedBranchId === b.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b.code}
              </button>
            ))}
          </div>
        </div>

        {/* Action shortcut to Handover Report */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{BRAND.companyName} Commercial Suite</span>
          </span>
          <button
            onClick={() => onNavigate('handover')}
            className="w-full sm:w-auto min-h-[38px] px-3.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Branch Handover View</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Setup & Project Cost"
          value={formatCurrency(totalProjectSetupCost, settings.currencySymbol)}
          subtitle="Civil + Assets + Site Costs"
          icon={Calculator}
          highlight={true}
        />
        <MetricCard
          title="Total Restaurant Assets"
          value={formatNumber(activeAssets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0))}
          subtitle={`${activeAssets.length} asset line items`}
          icon={PackageSearch}
        />
        <MetricCard
          title="Building Construction Cost"
          value={formatCurrency(totalConstructionCost, settings.currencySymbol)}
          subtitle={`${activeConstruction.length} contractor milestones`}
          icon={Hammer}
        />
        <MetricCard
          title="Branches Overview"
          value={`${activeBranchesCount} Active / ${branches.length} Total`}
          subtitle="Multi-branch network"
          icon={Building2}
        />
      </div>

      {/* Secondary Cost Categorization Cards */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Equipment & Asset Cost Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => onNavigate('kitchen')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-emerald-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Kitchen</span>
              <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(totalKitchenCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('hvac')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-sky-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">HVAC / AC</span>
              <Wind className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(totalHvacCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('furniture')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Furniture</span>
              <Armchair className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(totalFurnitureCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('electrical')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-yellow-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Electrical</span>
              <Zap className="w-3.5 h-3.5 text-yellow-600" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(totalElectricalCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('electrical')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-orange-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Lighting</span>
              <Zap className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(totalLightingCost, settings.currencySymbol)}
            </div>
          </div>

          <div
            onClick={() => onNavigate('it_pos')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-purple-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">IT & POS</span>
              <MonitorCheck className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(totalItPosCost, settings.currencySymbol)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category Visual Bars */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Cost Allocation by Category
              </h3>
              <p className="text-xs text-slate-500">
                Real-time capital distribution for {selectedBranchId === 'all' ? 'all branches' : 'selected branch'}
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-600">
              Total: {formatCurrency(totalProjectSetupCost, settings.currencySymbol)}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {costBreakdownList.map((item) => {
              const pct = totalProjectSetupCost > 0 ? (item.amount / totalProjectSetupCost) * 100 : 0;
              const barWidth = maxCategoryAmount > 0 ? (item.amount / maxCategoryAmount) * 100 : 0;
              const Icon = item.icon;
              return (
                <div key={item.label} className="group">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium text-slate-800">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-slate-900 font-semibold">
                        {formatCurrency(item.amount, settings.currencySymbol)}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px] w-12 text-right">
                        ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(barWidth, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Branch Setup Comparison & Budget Variance */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Branch Budget vs. Actual
              </h3>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                View Projects →
              </button>
            </div>

            <div className="space-y-4">
              {branches.map(b => {
                const breakdown = getBranchCostBreakdown(b.id);
                const project = projects.find(p => p.branchId === b.id);
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
                    className="p-3 rounded-md border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-900">{b.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{b.code}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
                      <span>Spent: {formatCurrency(breakdown.totalActual, settings.currencySymbol)}</span>
                      <span>Budget: {formatCurrency(breakdown.estimatedBudget, settings.currencySymbol)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full ${
                          breakdown.isOverBudget
                            ? 'bg-rose-500'
                            : percentSpent > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(percentSpent, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">
                        Status: <strong className="text-slate-700">{b.status}</strong>
                      </span>
                      <span
                        className={`font-mono font-medium ${
                          breakdown.isOverBudget ? 'text-rose-600' : 'text-emerald-700'
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
          <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>Automated calculations active</span>
            <span className="text-emerald-600 font-medium">Live Database Synced</span>
          </div>
        </div>
      </div>

      {/* Operations & Inventory Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Inventory Status Card */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Inventory Status</h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Open Inventory →
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Tracked Items</span>
              <span className="font-mono font-bold text-slate-900">{activeInventory.length} SKU</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Inventory Valuation</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(totalInventoryValue, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Low Stock Alerts</span>
              <span className="font-mono font-bold text-amber-600">
                {activeInventory.filter(i => i.currentStock <= i.minimumLevel).length} Items
              </span>
            </div>
          </div>
        </div>

        {/* Purchases Summary */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Purchase Orders</h3>
            <button
              onClick={() => onNavigate('purchases')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View POs →
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Orders Placed</span>
              <span className="font-mono font-bold text-slate-900">{activePurchases.length} Orders</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Purchase Value</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(totalPurchasesCost, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Delivery Received</span>
              <span className="font-mono font-bold text-emerald-600">
                {activePurchases.filter(p => p.deliveryStatus === 'Received').length} / {activePurchases.length}
              </span>
            </div>
          </div>
        </div>

        {/* Expenses Summary */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Operational Expenses</h3>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View Expenses →
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Expense Vouchers</span>
              <span className="font-mono font-bold text-slate-900">{activeExpenses.length} Records</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Expenses Logged</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(totalExpensesCost, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Largest Category</span>
              <span className="font-semibold text-slate-800">Utilities & Labour</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
