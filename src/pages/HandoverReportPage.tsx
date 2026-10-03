import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Printer,
  Download,
  Building,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel } from '../utils/excel';
import { exportAssetHandoverPDF } from '../utils/pdfGenerator';

export const HandoverReportPage: React.FC = () => {
  const {
    branches,
    projects,
    constructionCosts,
    assets,
    expenses,
    settings,
    selectedBranchId,
    setSelectedBranchId,
    getBranchCostBreakdown
  } = useData();

  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    return selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '';
  });

  const branch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const project = projects.find((p) => p.branchId === branch?.id);
  const breakdown = branch ? getBranchCostBreakdown(branch.id) : null;

  // Filtered by branch
  const branchConstruction = constructionCosts.filter((c) => c.branchId === branch?.id);
  const branchAssets = assets.filter((a) => a.branchId === branch?.id);
  const branchExpenses = expenses.filter((e) => e.branchId === branch?.id);

  const electricalAssets = branchAssets.filter((a) => a.category === 'electrical');
  const lightingAssets = branchAssets.filter((a) => a.category === 'lighting');
  const hvacAssets = branchAssets.filter((a) => a.category === 'hvac');
  const furnitureAssets = branchAssets.filter((a) => a.category === 'furniture');
  const kitchenAssets = branchAssets.filter((a) => a.category === 'kitchen');
  const itPosAssets = branchAssets.filter((a) => a.category === 'it_pos');

  const totalItemsCount = branchAssets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!branch) return;
    const doc = exportAssetHandoverPDF({
      branch,
      project,
      settings,
      assets: branchAssets
    });
    doc.save(`MKInnovexa_HandoverCertificate_${branch.code}.pdf`);
  };

  const handleExport = () => {
    if (!branch || !breakdown) return;
    const summarySheet = [
      { Section: 'Company', Value: settings.companyName },
      { Section: 'Branch Name', Value: branch.name },
      { Section: 'Branch Code', Value: branch.code },
      { Section: 'Location', Value: `${branch.address}, ${branch.city}` },
      { Section: 'Target Opening Date', Value: formatDate(branch.openingDate) },
      { Section: 'Total Installed Assets Count', Value: totalItemsCount },
      { Section: 'Construction & Civil Fit-out Cost', Value: breakdown.construction },
      { Section: 'Kitchen Equipment Cost', Value: breakdown.kitchen },
      { Section: 'HVAC & Air Conditioning Cost', Value: breakdown.hvac },
      { Section: 'Furniture & Fixtures Cost', Value: breakdown.furniture },
      { Section: 'Electrical Infrastructure Cost', Value: breakdown.electrical },
      { Section: 'Lighting Fixtures Cost', Value: breakdown.lighting },
      { Section: 'IT & POS Systems Cost', Value: breakdown.it_pos },
      { Section: 'General Operational Expenses', Value: breakdown.expenses },
      { Section: 'GRAND TOTAL PROJECT FIT-OUT COST', Value: breakdown.totalActual },
      { Section: 'Approved Project Budget', Value: breakdown.estimatedBudget },
      { Section: 'Budget Variance', Value: breakdown.remainingBudget }
    ];
    exportToExcel(summarySheet, `${branch.code}_Handover_Audit_Report`);
  };

  if (!branch || !breakdown) {
    return (
      <div className="p-12 bg-white rounded-lg border border-slate-200 text-center text-xs text-slate-500">
        No branches available to generate report.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control bar (hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-700 shrink-0">Handover Branch:</span>
          <select
            value={branch.id}
            onChange={(e) => setActiveBranchId(e.target.value)}
            className="w-full sm:w-auto min-h-[40px] sm:min-h-0 py-2 sm:py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-900 focus:bg-white focus:outline-hidden"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} - {b.name} ({b.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadPDF}
            className="min-h-[42px] px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download Branded PDF Certificate</span>
          </button>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={handleExport}
              className="min-h-[40px] px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Handover Document Print Surface */}
      <div className="print-page bg-white p-4 sm:p-8 lg:p-10 rounded-xl border border-slate-200 shadow-sm max-w-5xl mx-auto space-y-6 sm:space-y-8 overflow-hidden">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">
              {settings.companyName}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Branch Handover & Setup Completion Certificate
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Official verification of installed assets, MEP infrastructure, and fit-out capital costing
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-1 shrink-0">
            <div>
              Document Date: <strong className="font-mono text-slate-800">{formatDate(new Date().toISOString())}</strong>
            </div>
            <div>
              Branch Code: <strong className="font-mono text-slate-900">{branch.code}</strong>
            </div>
            <div>
              Operational Status: <strong className="text-emerald-700">{branch.status}</strong>
            </div>
          </div>
        </div>

        {/* Branch & Project Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
              Branch Identification
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <div>
                <strong>Facility:</strong> {branch.name}
              </div>
              <div>
                <strong>Address:</strong> {branch.address}, {branch.city}, {branch.province}
              </div>
              <div>
                <strong>Branch Manager:</strong> {branch.branchManager}
              </div>
              <div>
                <strong>Contact:</strong> {branch.contactNumber}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
              Project Timeline & Handover Milestones
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <div>
                <strong>Project Title:</strong> {project?.projectName || 'Standard Fit-out'}
              </div>
              <div>
                <strong>Project Manager:</strong> {project?.projectManager || branch.branchManager}
              </div>
              <div>
                <strong>Fit-out Period:</strong> {project ? `${formatDate(project.startDate)} to ${formatDate(project.expectedCompletionDate)}` : '-'}
              </div>
              <div>
                <strong>Official Opening Date:</strong> {formatDate(branch.openingDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Recap Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            1. Capital Fit-out & Asset Valuation Summary
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Milestone / Asset Discipline</th>
                  <th className="py-2.5 px-4 text-center">Items Installed</th>
                  <th className="py-2.5 px-4 text-right">Settled Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">Building, Civil & Structural Fit-out</td>
                  <td className="py-2.5 px-4 text-center text-slate-600">{branchConstruction.length} Milestones</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(breakdown.construction, settings.currencySymbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">Commercial Kitchen Equipment</td>
                  <td className="py-2.5 px-4 text-center text-slate-600">
                    {kitchenAssets.reduce((sum, a) => sum + a.quantity, 0)} Units
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(breakdown.kitchen, settings.currencySymbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">HVAC, Air Conditioning & Ventilation</td>
                  <td className="py-2.5 px-4 text-center text-slate-600">
                    {hvacAssets.reduce((sum, a) => sum + a.quantity, 0)} Units
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(breakdown.hvac, settings.currencySymbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">Dining Furniture & Commercial Millwork</td>
                  <td className="py-2.5 px-4 text-center text-slate-600">
                    {furnitureAssets.reduce((sum, a) => sum + a.quantity, 0)} Units
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(breakdown.furniture, settings.currencySymbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">Electrical Infrastructure & DB Panels</td>
                  <td className="py-2.5 px-4 text-center text-slate-600">
                    {electricalAssets.reduce((sum, a) => sum + a.quantity, 0)} Units
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(breakdown.electrical, settings.currencySymbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">Architectural & Ambient Lighting</td>
                  <td className="py-2.5 px-4 text-center text-slate-600">
                    {lightingAssets.reduce((sum, a) => sum + a.quantity, 0)} Units
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(breakdown.lighting, settings.currencySymbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">IT, POS Terminals & Surveillance</td>
                  <td className="py-2.5 px-4 text-center text-slate-600">
                    {itPosAssets.reduce((sum, a) => sum + a.quantity, 0)} Units
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(breakdown.it_pos, settings.currencySymbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">Labour, Utility Sanctions & Direct Expenses</td>
                  <td className="py-2.5 px-4 text-center text-slate-600">{branchExpenses.length} Vouchers</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(breakdown.expenses, settings.currencySymbol)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td className="py-3 px-4">TOTAL ACTUAL CAPITAL FIT-OUT EXPENDITURE</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-mono">
                    {totalItemsCount} Physical Assets
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400 text-sm">
                    {formatCurrency(breakdown.totalActual, settings.currencySymbol)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Budget vs Actual Comparison Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block">Approved Budget</span>
            <span className="font-mono font-bold text-slate-900 text-base mt-1 block">
              {formatCurrency(breakdown.estimatedBudget, settings.currencySymbol)}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block">Actual Expenditure</span>
            <span className="font-mono font-bold text-slate-900 text-base mt-1 block">
              {formatCurrency(breakdown.totalActual, settings.currencySymbol)}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block">Variance (Savings / Overrun)</span>
            <span
              className={`font-mono font-bold text-base mt-1 block ${
                breakdown.isOverBudget ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {breakdown.isOverBudget ? '-' : '+'}
              {formatCurrency(Math.abs(breakdown.remainingBudget), settings.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Sign-off & Handover Approvals */}
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
            2. Formal Commissioning, Handover & Executive Sign-off
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-xs text-slate-600">
            <div className="space-y-4">
              <div className="border-b border-slate-300 pb-8">
                <span className="text-slate-400 italic">Signature:</span>
              </div>
              <div>
                <strong>Prepared By (Site Project Manager)</strong>
                <div className="text-slate-500 mt-0.5">{branch.branchManager}</div>
                <div className="text-slate-400 text-[10px]">Date: ____________________</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-b border-slate-300 pb-8">
                <span className="text-slate-400 italic">Signature:</span>
              </div>
              <div>
                <strong>Checked & Verified By (Internal Audit)</strong>
                <div className="text-slate-500 mt-0.5">Lead Financial Controller</div>
                <div className="text-slate-400 text-[10px]">Date: ____________________</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-b border-slate-300 pb-8">
                <span className="text-slate-400 italic">Signature:</span>
              </div>
              <div>
                <strong>Approved By (Director Operations)</strong>
                <div className="text-slate-500 mt-0.5">Muhammad Khurram</div>
                <div className="text-slate-400 text-[10px]">Date: ____________________</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
