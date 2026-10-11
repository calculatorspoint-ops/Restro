import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Building,
  Filter,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel } from '../utils/excel';

export const ReportsPage: React.FC = () => {
  const {
    branches,
    projects,
    constructionCosts,
    assets,
    inventory,
    purchases,
    expenses,
    suppliers,
    locations,
    selectedBranchId,
    settings,
    getBranchCostBreakdown
  } = useData();

  const [activeReportId, setActiveReportId] = useState<string>('branch_setup_cost');
  const [filterBranchId, setFilterBranchId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'year' | 'quarter'>('all');

  const reportDefinitions = [
    { id: 'branch_setup_cost', title: '1. Branch Setup Cost Report', description: 'Consolidated capital expenditure breakdown per restaurant branch' },
    { id: 'construction_cost', title: '2. Construction Cost Report', description: 'Civil, interior, flooring, false ceiling, and contractor milestones' },
    { id: 'electrical_inventory', title: '3. Electrical Inventory Report', description: 'Installed distribution boards, breakers, wiring, and transformers' },
    { id: 'lighting', title: '4. Lighting Report', description: 'Downlights, pendant fixtures, emergency lights, and wattages' },
    { id: 'hvac', title: '5. AC / HVAC Report', description: 'Cassette units, inverter splits, tonnage, and scheduled maintenance' },
    { id: 'furniture', title: '6. Furniture & Fixtures Report', description: 'Dining tables, chairs, banquette booths, and service counters' },
    { id: 'kitchen', title: '7. Kitchen Equipment Report', description: 'Commercial cooking ranges, fryers, ovens, chillers, and SS tables' },
    { id: 'it_pos', title: '8. IT / POS Systems Report', description: 'Billing terminals, thermal printers, cash drawers, and CCTV cameras' },
    { id: 'complete_assets', title: '9. Complete Central Asset Register', description: 'Master registry of all physical branch assets with serial numbers' },
    { id: 'inventory', title: '10. Inventory Valuation Report', description: 'Stock-on-hand, SKU costs, reorder alerts, and current valuations' },
    { id: 'purchases', title: '11. Purchase Order Register', description: 'All purchase contracts, delivery receipts, and tax calculations' },
    { id: 'expenses', title: '12. Operational Expense Report', description: 'Daily vouchers, site labour wages, transportation, and utility charges' },
    { id: 'suppliers', title: '13. Supplier Performance & Payables', description: 'Total purchase history and outstanding balances by vendor' },
    { id: 'location_assets', title: '14. Location-wise Asset Distribution', description: 'Physical room-wise installed value (Dining, Kitchen, Foyer)' },
    { id: 'branch_comparison', title: '15. Branch Cost Comparison Report', description: 'Side-by-side cost benchmarking across all company branches' },
    { id: 'budget_vs_actual', title: '16. Budget vs. Actual Variance Report', description: 'Variance analysis showing cost savings or budget overruns' }
  ];

  // Resolve current active report data
  const currentReport = useMemo(() => {
    const targetBranches = filterBranchId === 'all' ? branches : branches.filter(b => b.id === filterBranchId);

    switch (activeReportId) {
      case 'branch_setup_cost': {
        const rows = targetBranches.map((b) => {
          const bd = getBranchCostBreakdown(b.id);
          return {
            'Branch Code': b.code,
            'Branch Name': b.name,
            'City': b.city,
            'Status': b.status,
            'Construction Cost': bd.construction,
            'Kitchen Equipment': bd.kitchen,
            'HVAC / AC': bd.hvac,
            'Furniture': bd.furniture,
            'Electrical & Lighting': bd.electrical + bd.lighting,
            'IT & POS': bd.it_pos,
            'Direct Expenses': bd.expenses,
            'Total Actual Cost': bd.totalActual,
            'Approved Budget': bd.estimatedBudget,
            'Variance': bd.remainingBudget
          };
        });
        return { title: 'Branch Setup Cost Report', rows };
      }
      case 'construction_cost': {
        const filtered = constructionCosts.filter(
          (c) => filterBranchId === 'all' || c.branchId === filterBranchId
        );
        const rows = filtered.map((c) => {
          const b = branches.find((br) => br.id === c.branchId);
          return {
            'Date': formatDate(c.date),
            'Branch': b?.code || '',
            'Category': c.category,
            'Description': c.description,
            'Work Area': c.workArea,
            'Contractor': c.vendorContractor,
            'Quantity': c.quantity,
            'Unit Rate': c.unitRate,
            'Total Cost': c.totalCost,
            'Paid': c.paidAmount,
            'Payment Status': c.paymentStatus
          };
        });
        return { title: 'Construction & Civil Cost Report', rows };
      }
      case 'complete_assets':
      case 'electrical_inventory':
      case 'lighting':
      case 'hvac':
      case 'furniture':
      case 'kitchen':
      case 'it_pos': {
        const targetCategory =
          activeReportId === 'electrical_inventory'
            ? 'electrical'
            : activeReportId === 'lighting'
            ? 'lighting'
            : activeReportId === 'hvac'
            ? 'hvac'
            : activeReportId === 'furniture'
            ? 'furniture'
            : activeReportId === 'kitchen'
            ? 'kitchen'
            : activeReportId === 'it_pos'
            ? 'it_pos'
            : 'all';

        const filtered = assets.filter((a) => {
          const matchesBranch = filterBranchId === 'all' || a.branchId === filterBranchId;
          const matchesCat = targetCategory === 'all' || a.category === targetCategory;
          return matchesBranch && matchesCat;
        });

        const rows = filtered.map((a) => {
          const b = branches.find((br) => br.id === a.branchId);
          return {
            'Asset ID': a.id,
            'Branch': b?.code || '',
            'Item Name': a.itemName,
            'Category': a.category,
            'Subcategory': a.subcategory,
            'Location': a.locationName,
            'Brand / Model': `${a.brand} ${a.model || ''}`,
            'Quantity': a.quantity,
            'Unit': a.unit,
            'Unit Cost': a.unitCost,
            'Total Cost': a.totalCost,
            'Serial #': a.serialNumber,
            'Condition': a.condition,
            'Status': a.status
          };
        });
        return { title: 'Asset Register Report', rows };
      }
      case 'inventory': {
        const filtered = inventory.filter((i) => filterBranchId === 'all' || i.branchId === filterBranchId);
        const rows = filtered.map((i) => {
          const b = branches.find((br) => br.id === i.branchId);
          return {
            'SKU Code': i.itemCode,
            'Item Name': i.itemName,
            'Branch': b?.code || '',
            'Category': i.category,
            'Current Stock': i.currentStock,
            'Unit': i.unit,
            'Unit Cost': i.unitCost,
            'Total Stock Value': i.stockValue,
            'Min Level': i.minimumLevel,
            'Reorder Level': i.reorderLevel,
            'Supplier': i.supplierName
          };
        });
        return { title: 'Inventory Valuation Report', rows };
      }
      case 'purchases': {
        const filtered = purchases.filter((p) => filterBranchId === 'all' || p.branchId === filterBranchId);
        const rows = filtered.map((p) => {
          const b = branches.find((br) => br.id === p.branchId);
          return {
            'PO Number': p.poNumber,
            'Date': formatDate(p.date),
            'Branch': b?.code || '',
            'Supplier': p.supplierName,
            'Category': p.category,
            'Subtotal': p.subtotal,
            'Tax': p.tax,
            'Grand Total': p.grandTotal,
            'Delivery Status': p.deliveryStatus,
            'Payment Status': p.paymentStatus
          };
        });
        return { title: 'Purchase Orders Report', rows };
      }
      case 'expenses': {
        const filtered = expenses.filter((e) => filterBranchId === 'all' || e.branchId === filterBranchId);
        const rows = filtered.map((e) => {
          const b = branches.find((br) => br.id === e.branchId);
          return {
            'Date': formatDate(e.date),
            'Branch': b?.code || '',
            'Category': e.category,
            'Description': e.description,
            'Amount': e.amount,
            'Paid By': e.paidBy,
            'Method': e.paymentMethod,
            'Payee': e.vendor,
            'Ref #': e.referenceNumber
          };
        });
        return { title: 'Operational Expenses Report', rows };
      }
      case 'suppliers': {
        const rows = suppliers.map((s) => ({
          'Supplier ID': s.id,
          'Company Name': s.name,
          'Contact Person': s.contactPerson,
          'Phone': s.phone,
          'Category': s.category,
          'Total Business (PKR)': s.totalPurchases,
          'Paid (PKR)': s.paidAmount,
          'Outstanding (PKR)': s.outstandingAmount,
          'Payment Terms': s.paymentTerms
        }));
        return { title: 'Supplier Accounts Report', rows };
      }
      case 'location_assets': {
        const filtered = locations.filter((l) => filterBranchId === 'all' || l.branchId === filterBranchId);
        const rows = filtered.map((loc) => {
          const locAssets = assets.filter((a) => a.locationId === loc.id || a.locationName === loc.name);
          const b = branches.find((br) => br.id === loc.branchId);
          return {
            'Branch': b?.code || '',
            'Location': loc.name,
            'Code': loc.code,
            'Asset Entries': locAssets.length,
            'Total Quantity': locAssets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0),
            'Total Installed Valuation (PKR)': locAssets.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0)
          };
        });
        return { title: 'Location Asset Distribution Report', rows };
      }
      case 'branch_comparison':
      case 'budget_vs_actual':
      default: {
        const rows = targetBranches.map((b) => {
          const bd = getBranchCostBreakdown(b.id);
          const proj = projects.find((p) => p.branchId === b.id);
          return {
            'Branch': b.name,
            'Code': b.code,
            'City': b.city,
            'Project Manager': proj?.projectManager || b.branchManager,
            'Estimated Budget': bd.estimatedBudget,
            'Actual Cost': bd.totalActual,
            'Variance (PKR)': bd.remainingBudget,
            'Budget Status': bd.isOverBudget ? 'Over Budget' : 'Under Budget'
          };
        });
        return { title: 'Budget vs Actual Performance Report', rows };
      }
    }
  }, [
    activeReportId,
    filterBranchId,
    branches,
    projects,
    constructionCosts,
    assets,
    inventory,
    purchases,
    expenses,
    suppliers,
    locations,
    getBranchCostBreakdown
  ]);

  const handleExport = () => {
    if (!currentReport || currentReport.rows.length === 0) return;
    exportToExcel(currentReport.rows, `Report_${activeReportId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Building className="w-4 h-4 text-slate-400" />
            <span>Branch Filter:</span>
          </div>
          <select
            value={filterBranchId}
            onChange={(e) => setFilterBranchId(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-900 focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Branches (Consolidated)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} - {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2 Column Layout: Report Selector on Left, Dynamic Data on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 16 Standard Report Index */}
        <div className="no-print lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Available Management Reports (16)
          </div>

          <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
            {reportDefinitions.map((rep) => {
              const isSelected = activeReportId === rep.id;
              return (
                <button
                  key={rep.id}
                  onClick={() => setActiveReportId(rep.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold">{rep.title}</div>
                  <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {rep.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Report View Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {settings.companyName} · Official Audit Extract
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {reportDefinitions.find((r) => r.id === activeReportId)?.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scope: {filterBranchId === 'all' ? 'All Restaurant Branches' : branches.find((b) => b.id === filterBranchId)?.name}
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs text-slate-500">
                Generated: {formatDate(new Date().toISOString())}
              </div>
            </div>

            {/* Dynamic Report Table */}
            {currentReport && currentReport.rows.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      {Object.keys(currentReport.rows[0]).map((key) => (
                        <th key={key} className="py-2.5 px-3 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentReport.rows.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        {Object.entries(row).map(([k, val]: [string, any], vIdx: number) => {
                          const isNumber = typeof val === 'number';
                          const kLower = String(k || '').toLowerCase();
                          const isCost =
                            kLower.includes('cost') ||
                            kLower.includes('budget') ||
                            kLower.includes('variance') ||
                            kLower.includes('amount') ||
                            kLower.includes('total') ||
                            kLower.includes('value') ||
                            kLower.includes('paid');

                          return (
                            <td
                              key={vIdx}
                              className={`py-2.5 px-3 whitespace-nowrap ${
                                isNumber ? 'text-right font-mono tabular-nums' : 'text-slate-800'
                              }`}
                            >
                              {isCost && isNumber
                                ? formatCurrency(val, settings.currencySymbol)
                                : isNumber
                                ? val.toLocaleString('en-PK')
                                : String(val ?? '-')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                No matching records for this report in the selected scope.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
