import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ClipboardCheck,
  DollarSign,
  Package,
  Calendar,
  User,
  Share2,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../config/brand';
import {
  exportInspectionSheetPDF,
  exportPaymentVoucherPDF,
  exportAssetHandoverPDF,
  InspectionCheckItem
} from '../utils/pdfGenerator';

type DocTemplateType = 'inspection_sheet' | 'contractor_voucher' | 'asset_handover';

export const BrandedDocumentsPage: React.FC = () => {
  const { currentUser, isSuperManager } = useAuth();
  const {
    settings,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    projects,
    constructionCosts,
    assets
  } = useData();

  const hasGlobalBranchAccess = useMemo(() => {
    if (!currentUser) return false;
    return isSuperManager || (currentUser.assignedBranchIds && currentUser.assignedBranchIds.includes('all'));
  }, [currentUser, isSuperManager]);

  const [activeTemplate, setActiveTemplate] = useState<DocTemplateType>('inspection_sheet');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active branch context
  const currentBranch = useMemo(() => {
    if (selectedBranchId !== 'all') {
      const found = branches.find((b) => b.id === selectedBranchId);
      if (found) return found;
    }
    return branches[0] || {
      id: 'br-khi-01',
      code: 'KHI-01',
      name: 'Clifton Flagship Bistro & Grill',
      address: 'Plot 14-C, Block 4, Clifton, Sea View Boulevard',
      city: 'Karachi',
      branchManager: 'Tariq Mehmood',
      contactNumber: '+92 21 35876543',
      status: 'Setup in Progress'
    };
  }, [branches, selectedBranchId]);

  // Project linked to the current branch
  const currentProject = useMemo(() => {
    return (
      projects.find((p) => p.branchId === currentBranch.id) ||
      projects[0] || {
        projectName: `${currentBranch.name} Fit-out & Launch`,
        projectManager: 'Engr. Tariq Mehmood',
        status: 'In Progress'
      }
    );
  }, [projects, currentBranch]);

  // Construction costs belonging to the current branch
  const branchConstructionCosts = useMemo(() => {
    const list = constructionCosts.filter((c) => c.branchId === currentBranch.id);
    return list.length > 0 ? list : constructionCosts.slice(0, 3);
  }, [constructionCosts, currentBranch]);

  // Assets belonging to the current branch
  const branchAssets = useMemo(() => {
    const list = assets.filter((a) => a.branchId === currentBranch.id);
    return list.length > 0 ? list : assets;
  }, [assets, currentBranch]);

  // Selected Cost Item for Payment Voucher
  const [selectedCostId, setSelectedCostId] = useState<string>('');
  const activeCostItem = useMemo(() => {
    if (selectedCostId) {
      const found = branchConstructionCosts.find((c) => c.id === selectedCostId);
      if (found) return found;
    }
    return branchConstructionCosts[0] || {
      id: 'cc-default',
      branchId: currentBranch.id,
      category: 'Flooring & Civil Work',
      vendorContractor: 'Al-Madina Tile Emporium',
      invoiceRefNumber: 'INV-AMT-2026-08',
      workArea: 'Main Dining Hall & Corridors',
      totalCost: 1810000,
      paidAmount: 1200000,
      paymentStatus: 'Partial'
    };
  }, [branchConstructionCosts, selectedCostId, currentBranch]);

  // Inspection Checklist Items
  const [inspectionItems, setInspectionItems] = useState<InspectionCheckItem[]>([
    { area: 'Civil & Flooring', check: 'Porcelain tile grouting, non-slip slope towards floor drains', status: 'Passed', remarks: 'Epoxy waterproof grouting verified; slope tested with water' },
    { area: 'Ceiling & Lighting', check: 'False ceiling shadow channels & Philips LED recessed fixtures', status: 'Passed', remarks: 'All 24 fixtures tested on main board' },
    { area: 'HVAC & Ventilation', check: '4-Ton Gree Cassette AC condensation drain pipe gradient test', status: 'Passed', remarks: 'Zero leakage over 4-hour continuous run' },
    { area: 'Commercial Kitchen', check: 'Kitchen exhaust hood airflow velocity & Ansul fire suppression', status: 'Action Required', remarks: 'Exhaust motor balanced; fire nozzle calibration pending' },
    { area: 'Electrical & Power', check: 'Main DB board earth leakage trip and phase load balancing', status: 'Passed', remarks: 'Earth resistance measured at 1.8 ohms' },
    { area: 'Gas Line & Safety', check: 'Natural gas pipeline 24-hr pressure hold test at 15 PSI', status: 'Passed', remarks: 'Pressure held steady; approved by gas contractor' },
    { area: 'Plumbing & Drainage', check: 'Grease trap installation under 3-compartment kitchen sink', status: 'Passed', remarks: 'Stainless steel 50L grease interceptor installed' }
  ]);

  const [inspectorName, setInspectorName] = useState(currentProject.projectManager || 'Engr. Tariq Mehmood');
  const [overallVerdict, setOverallVerdict] = useState(
    'All primary MEP, safety fire suppression, and civil parameters verified per MK Innovexa group engineering standards.'
  );
  const [retentionPercent, setRetentionPercent] = useState<number>(5);
  const [paymentMethod, setPaymentMethod] = useState<string>('Crossed Cheque / RTGS Corporate Bank Transfer');

  // Toggle status of an inspection item
  const toggleInspectionStatus = (index: number) => {
    setInspectionItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextStatus: Record<string, 'Passed' | 'Action Required' | 'Pending'> = {
          Passed: 'Action Required',
          'Action Required': 'Pending',
          Pending: 'Passed'
        };
        return { ...item, status: nextStatus[item.status] };
      })
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    setDownloadSuccess(null);

    try {
      if (activeTemplate === 'inspection_sheet') {
        const doc = await exportInspectionSheetPDF({
          branch: currentBranch,
          project: currentProject,
          settings,
          inspectorName,
          items: inspectionItems,
          overallRemarks: overallVerdict
        });
        doc.save(`MKInnovexa_InspectionSheet_${currentBranch.code}.pdf`);
        setDownloadSuccess(`Inspection Sheet for ${currentBranch.name} exported.`);
      } else if (activeTemplate === 'contractor_voucher') {
        const doc = await exportPaymentVoucherPDF({
          branch: currentBranch,
          project: currentProject,
          settings,
          costItem: activeCostItem as any,
          retentionPercent,
          paymentMethod
        });
        doc.save(
          `MKInnovexa_PaymentVoucher_${currentBranch.code}_${activeCostItem.invoiceRefNumber || 'milestone'}.pdf`
        );
        setDownloadSuccess(`Payment Voucher for ${activeCostItem.vendorContractor} exported.`);
      } else {
        const doc = await exportAssetHandoverPDF({
          branch: currentBranch,
          project: currentProject,
          settings,
          assets: branchAssets
        });
        doc.save(`MKInnovexa_AssetHandover_${currentBranch.code}.pdf`);
        setDownloadSuccess(`Asset Handover Certificate for ${currentBranch.name} exported.`);
      }
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      alert('Error generating PDF document. Please check console logs.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setDownloadSuccess(null), 4000);
    }
  };

  // Calculations for current cost item
  const grossCost = Number(activeCostItem.totalCost) || 0;
  const retentionDeduction = Math.round(grossCost * (retentionPercent / 100));
  const netAuthorizedAmount = grossCost - retentionDeduction;

  // Assets aggregate
  const totalAssetsCount = branchAssets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0);
  const totalAssetsValue = branchAssets.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-slate-900 text-emerald-400 font-semibold uppercase tracking-wider">
              {BRAND.companyName} Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">·</span>
            <span className="text-xs text-slate-500 font-semibold">Official Export Suite</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Branded Documents & PDF Export</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate audit-compliant, formatted inspection sheets, contractor payment releases, and asset handover certificates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Picker */}
          <div className="relative">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs appearance-none focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              {hasGlobalBranchAccess && (
                <option value="all">All Branches (Default: {branches[0]?.code})</option>
              )}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Sheet</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isGenerating ? 'Generating PDF...' : 'Download Branded PDF'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Bar */}
      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between shadow-xs print:hidden animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{downloadSuccess}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono">MK Innovexa PDF Engine</span>
        </div>
      )}

      {/* Template Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <button
          type="button"
          onClick={() => setActiveTemplate('inspection_sheet')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTemplate === 'inspection_sheet'
              ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <span>Pre-Handover Inspection Sheet</span>
            </div>
            {activeTemplate === 'inspection_sheet' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Multi-zone checklist for civil flooring, MEP load, kitchen exhaust velocity, and gas line safety tests.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTemplate('contractor_voucher')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTemplate === 'contractor_voucher'
              ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <DollarSign className="w-4 h-4 text-sky-600" />
              <span>Contractor Payment Voucher</span>
            </div>
            {activeTemplate === 'contractor_voucher' && (
              <span className="w-2 h-2 rounded-full bg-sky-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Milestone invoice verification, 5% retention hold calculation, and official treasury payment release.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTemplate('asset_handover')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTemplate === 'asset_handover'
              ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Asset Handover Certificate</span>
            </div>
            {activeTemplate === 'asset_handover' && (
              <span className="w-2 h-2 rounded-full bg-purple-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Official equipment custody transfer from Project Fit-out Engineer to Branch GM with asset serials.
          </p>
        </button>
      </div>

      {/* Interactive Customization Controls Bar (Print Hidden) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Template Controls (Applies directly to exported PDF)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Active Context: {currentBranch.code} ({currentBranch.city})
          </span>
        </div>

        {activeTemplate === 'inspection_sheet' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Lead Inspector / Fit-out Engineer Name:
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Engr. Tariq Mehmood"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Executive Verdict & Engineering Remarks:
              </label>
              <input
                type="text"
                value={overallVerdict}
                onChange={(e) => setOverallVerdict(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                placeholder="Remarks printed on official PDF..."
              />
            </div>
          </div>
        )}

        {activeTemplate === 'contractor_voucher' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Select Contractor Milestone:
              </label>
              <select
                value={activeCostItem.id}
                onChange={(e) => setSelectedCostId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                {branchConstructionCosts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.vendorContractor} — {c.category} (Rs. {(Number(c.totalCost) || 0).toLocaleString('en-PK')})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Retention Deduction (%):
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={retentionPercent}
                onChange={(e) => setRetentionPercent(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Payment Disbursement Channel:
              </label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {activeTemplate === 'asset_handover' && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <span>
                Total Assets in Branch: <strong>{branchAssets.length} line items</strong>
              </span>
              <span>·</span>
              <span>
                Total Units: <strong>{totalAssetsCount} units</strong>
              </span>
              <span>·</span>
              <span>
                Total Valuation:{' '}
                <strong className="text-emerald-700 font-mono">
                  Rs. {totalAssetsValue.toLocaleString('en-PK')}
                </strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Custody transferred to Branch GM: <strong>{currentBranch.branchManager}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Rendered Official Document Preview Canvas */}
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl mx-auto p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
        {/* Top Header Banner: Organization & MK Innovexa Brand */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold text-xl shadow-md border border-slate-800 shrink-0">
              <span className="font-mono text-emerald-400 font-extrabold text-sm">MK</span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {settings.companyName}
              </h2>
              <span className="text-xs text-slate-500 font-medium block">
                {settings.companyTagline}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                {BRAND.productName} · Certified Enterprise Operations System
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0">
            <div className="inline-block px-2 py-0.5 rounded-xs bg-slate-900 text-emerald-400 font-mono font-bold text-[10px] tracking-wider uppercase mb-1">
              {BRAND.companyName} CERTIFIED
            </div>
            <span className="text-xs font-mono font-bold text-slate-800 block">
              REF: {currentBranch.code}-{Date.now().toString().slice(-4)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong>
            </span>
          </div>
        </div>

        {/* Branch Context Info Card */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Branch Location</span>
            <span className="font-bold text-slate-900">{currentBranch.name}</span>
            <span className="text-[10px] text-slate-500 block font-mono">Code: {currentBranch.code} ({currentBranch.city})</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fit-out Project</span>
            <span className="font-bold text-slate-900">{currentProject.projectName}</span>
            <span className="text-[10px] text-emerald-700 block font-medium">Status: {currentProject.status}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Branch Custodian (GM)</span>
            <span className="font-bold text-slate-900">{currentBranch.branchManager || 'Branch GM'}</span>
            <span className="text-[10px] text-slate-500 block font-mono">{currentBranch.contactNumber}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Project Engineer</span>
            <span className="font-bold text-slate-900">{inspectorName}</span>
            <span className="text-[10px] text-slate-500 block">Lead MEP & Civil Auditor</span>
          </div>
        </div>

        {/* Dynamic Template Content */}
        {activeTemplate === 'inspection_sheet' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-0.5">
                  PRE-HANDOVER CIVIL, MEP & EQUIPMENT INSPECTION SHEET
                </h3>
                <p className="text-xs text-slate-500">
                  Click any status badge below to toggle inspection findings (Passed, Action Required, Pending).
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                {inspectionItems.filter((i) => i.status === 'Passed').length} / {inspectionItems.length} Checks Cleared
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-white text-left font-semibold">
                  <tr>
                    <th className="p-2.5">Area / System</th>
                    <th className="p-2.5">Audit Criteria & Testing Protocol</th>
                    <th className="p-2.5 text-center">Status (Click to toggle)</th>
                    <th className="p-2.5">Inspector Findings & Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {inspectionItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-bold text-slate-900">{item.area}</td>
                      <td className="p-2.5">{item.check}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleInspectionStatus(idx)}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                            item.status === 'Passed'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : item.status === 'Action Required'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className="p-2.5 text-slate-600">{item.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <strong className="text-slate-800 block mb-0.5">Overall Handover Readiness Verdict:</strong>
              <p className="text-slate-600">{overallVerdict}</p>
            </div>
          </div>
        )}

        {activeTemplate === 'contractor_voucher' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1">
                CONTRACTOR MILESTONE PAYMENT VERIFICATION VOUCHER
              </h3>
              <p className="text-xs text-slate-500">
                Official milestone release certification with defect liability retention accounting.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-white text-left font-semibold">
                  <tr>
                    <th className="p-3">Milestone Scope & Description</th>
                    <th className="p-3">Work Zone / Scope</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-bold text-slate-900">
                      Gross Certified Work Completion ({activeCostItem.category})
                    </td>
                    <td className="p-3">{activeCostItem.workArea}</td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-sm">
                        VERIFIED
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      Rs. {grossCost.toLocaleString('en-PK')}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-700">
                      Standard Defects Liability Retention Hold ({retentionPercent}%)
                    </td>
                    <td className="p-3 text-slate-500">Held for 90-day defect liability period</td>
                    <td className="p-3 text-center text-rose-600 font-bold text-[10px]">
                      DEDUCTED
                    </td>
                    <td className="p-3 text-right font-mono text-rose-600 font-bold">
                      - Rs. {retentionDeduction.toLocaleString('en-PK')}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold">
                    <td className="p-3 text-slate-900">
                      NET AUTHORIZED PAYABLE AMOUNT
                    </td>
                    <td className="p-3 text-emerald-800">Ready for Treasury Cheque / RTGS Release</td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-sm">
                        {activeCostItem.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-900 text-sm">
                      Rs. {netAuthorizedAmount.toLocaleString('en-PK')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
              <div>
                <strong>Payment Channel:</strong> {paymentMethod}
              </div>
              <div>
                <strong>Contractor Account:</strong> {activeCostItem.vendorContractor} (Ref: {activeCostItem.invoiceRefNumber || 'N/A'})
              </div>
            </div>
          </div>
        )}

        {activeTemplate === 'asset_handover' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1">
                CAPITAL ASSET & EQUIPMENT HANDOVER CERTIFICATE
              </h3>
              <p className="text-xs text-slate-500">
                Official property and custody transfer of restaurant equipment and assets to Branch General Manager.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-white text-left font-semibold">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Asset Item & Model</th>
                    <th className="p-2.5">Serial / Tag</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-center">Condition</th>
                    <th className="p-2.5 text-right">Cost (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {branchAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{asset.category.toUpperCase()}</td>
                      <td className="p-2.5">{asset.itemName}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">
                        {asset.serialNumber || 'TAG-N/A'}
                      </td>
                      <td className="p-2.5 text-center font-medium">
                        {asset.quantity} {asset.unit}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-sm">
                          {asset.condition}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        Rs. {(Number(asset.totalCost) || 0).toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold">
                  <tr>
                    <td colSpan={3} className="p-2.5">
                      TOTAL CAPITAL ASSETS HANDED OVER
                    </td>
                    <td className="p-2.5 text-center">{totalAssetsCount} Units</td>
                    <td className="p-2.5 text-center">100% OPERATIONAL</td>
                    <td className="p-2.5 text-right font-mono text-emerald-400">
                      Rs. {totalAssetsValue.toLocaleString('en-PK')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <strong>Custody Transfer Agreement:</strong> The Branch General Manager accepts full operational custody and custody accountability for the above-listed capital equipment, fixtures, and appliances.
            </div>
          </div>
        )}

        {/* Formal Signature Blocks */}
        <div className="pt-10 mt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="border-b border-slate-300 pb-1 mb-2 font-mono text-xs text-slate-400">
              Sign: ___________________
            </div>
            <span className="text-xs font-bold text-slate-900 block">
              {activeTemplate === 'inspection_sheet'
                ? 'Lead Project Engineer'
                : activeTemplate === 'contractor_voucher'
                ? 'Fit-out Site Engineer'
                : 'Project Fit-out Engineer'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {inspectorName}
            </span>
          </div>

          <div>
            <div className="border-b border-slate-300 pb-1 mb-2 font-mono text-xs text-slate-400">
              Sign: ___________________
            </div>
            <span className="text-xs font-bold text-slate-900 block">
              Branch General Manager
            </span>
            <span className="text-[10px] text-slate-500 block">
              {currentBranch.branchManager || 'Branch Custodian'}
            </span>
          </div>

          <div>
            <div className="border-b border-slate-300 pb-1 mb-2 font-mono text-xs text-slate-400">
              Sign: ___________________
            </div>
            <span className="text-xs font-bold text-slate-900 block">
              Director of Operations
            </span>
            <span className="text-[10px] text-slate-500 block">
              {BRAND.companyName} Commercial Group
            </span>
          </div>
        </div>

        {/* Bottom System Legal Footnote */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <span>{BRAND.productName} · {BRAND.poweredByNotice}</span>
          <span>{BRAND.copyrightNotice}</span>
        </div>
      </div>
    </div>
  );
};
