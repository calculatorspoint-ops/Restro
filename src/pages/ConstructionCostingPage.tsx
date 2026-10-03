import React, { useState, useMemo } from 'react';
import {
  Hammer,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  FileText
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ConstructionCost, ConstructionCategory, PaymentStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel } from '../utils/excel';

const CONSTRUCTION_CATEGORIES: ConstructionCategory[] = [
  'Civil Work',
  'Flooring',
  'Ceiling',
  'Painting',
  'Glass Work',
  'Aluminum Work',
  'Carpentry',
  'Plumbing',
  'Electrical Work',
  'Masonry',
  'Signage',
  'Interior Work',
  'Exterior Work',
  'Labour',
  'Transportation',
  'Other Construction Work'
];

export const ConstructionCostingPage: React.FC = () => {
  const {
    branches,
    locations,
    filteredConstructionCosts,
    saveConstructionCost,
    deleteConstructionCost,
    selectedBranchId,
    settings
  } = useData();
  const { canDeleteRecords } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Partial<ConstructionCost> | null>(null);
  const [deleteModalCost, setDeleteModalCost] = useState<ConstructionCost | null>(null);

  // Filters
  const displayedCosts = useMemo(() => {
    return filteredConstructionCosts.filter((c) => {
      const branch = branches.find((b) => b.id === c.branchId);
      const matchesSearch =
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vendorContractor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.workArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.invoiceRefNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesPay = paymentFilter === 'all' || c.paymentStatus === paymentFilter;

      return matchesSearch && matchesCat && matchesPay;
    });
  }, [filteredConstructionCosts, branches, searchTerm, categoryFilter, paymentFilter]);

  // Aggregate Metrics
  const totalCost = displayedCosts.reduce((sum, c) => sum + (Number(c.totalCost) || 0), 0);
  const paidCost = displayedCosts.reduce((sum, c) => sum + (Number(c.paidAmount) || 0), 0);
  const unpaidCost = totalCost - paidCost;

  const handleOpenCreate = () => {
    const targetBranchId = selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '';
    setEditingCost({
      branchId: targetBranchId,
      date: new Date().toISOString().slice(0, 10),
      category: 'Civil Work',
      subcategory: '',
      description: '',
      workArea: 'Main Dining Hall',
      vendorContractor: '',
      quantity: 1,
      unit: 'sqft',
      unitRate: 0,
      materialCost: 0,
      labourCost: 0,
      otherCost: 0,
      totalCost: 0,
      paymentStatus: 'Paid',
      paidAmount: 0,
      invoiceRefNumber: '',
      remarks: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cost: ConstructionCost) => {
    setEditingCost({ ...cost });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCost || !editingCost.branchId || !editingCost.description) return;

    const mat = Number(editingCost.materialCost) || 0;
    const lab = Number(editingCost.labourCost) || 0;
    const oth = Number(editingCost.otherCost) || 0;

    let computedTotal = mat + lab + oth;
    if (computedTotal === 0 && (editingCost.quantity || 0) > 0 && (editingCost.unitRate || 0) > 0) {
      computedTotal = (Number(editingCost.quantity) || 1) * (Number(editingCost.unitRate) || 0);
    }

    const paid = Number(editingCost.paidAmount) || 0;

    await saveConstructionCost({
      ...editingCost,
      materialCost: mat,
      labourCost: lab,
      otherCost: oth,
      totalCost: computedTotal,
      paidAmount: paid
    });

    setIsFormOpen(false);
    setEditingCost(null);
  };

  const handleExport = () => {
    const exportData = displayedCosts.map((c) => {
      const branch = branches.find((b) => b.id === c.branchId);
      return {
        'Cost ID': c.id,
        'Branch Code': branch?.code || '',
        'Branch Name': branch?.name || '',
        'Date': formatDate(c.date),
        'Category': c.category,
        'Subcategory': c.subcategory || '',
        'Description': c.description,
        'Work Area': c.workArea,
        'Vendor / Contractor': c.vendorContractor,
        'Quantity': c.quantity,
        'Unit': c.unit,
        'Unit Rate (PKR)': c.unitRate,
        'Material Cost (PKR)': c.materialCost,
        'Labour Cost (PKR)': c.labourCost,
        'Other Cost (PKR)': c.otherCost,
        'Total Cost (PKR)': c.totalCost,
        'Payment Status': c.paymentStatus,
        'Paid Amount (PKR)': c.paidAmount,
        'Invoice Ref Number': c.invoiceRefNumber,
        'Remarks': c.remarks
      };
    });
    exportToExcel(exportData, 'Construction_Costing_Report');
  };

  return (
    <div className="space-y-6">
      {/* Metric Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Total Construction Cost</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(totalCost, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{displayedCosts.length} milestones logged</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Disbursed / Paid Amount</span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
            {formatCurrency(paidCost, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
            {totalCost > 0 ? ((paidCost / totalCost) * 100).toFixed(1) : 0}% settled
          </span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Outstanding / Pending Balance</span>
          <span className="text-xl font-bold font-mono text-amber-700 mt-1 block">
            {formatCurrency(unpaidCost, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Contractor retentions & balance</span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contractor, area, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {CONSTRUCTION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Construction Item</span>
          </button>
        </div>
      </div>

      {/* Main Records Container: Responsive Mobile Cards (< md) + Desktop Table (>= md) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Mobile View (< md): High-density touch-friendly cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {displayedCosts.map((cost) => {
            const branch = branches.find((b) => b.id === cost.branchId);

            return (
              <div key={cost.id} className="p-4 space-y-2.5 hover:bg-slate-50/60 active:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{cost.category}</span>
                      {cost.subcategory && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-xs">
                          {cost.subcategory}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      {formatDate(cost.date)} · {branch?.code} ({branch?.city})
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border shrink-0 ${
                      cost.paymentStatus === 'Paid'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : cost.paymentStatus === 'Partial'
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}
                  >
                    {cost.paymentStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-700 leading-snug">
                  {cost.description}
                  {cost.invoiceRefNumber && (
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      Ref: {cost.invoiceRefNumber} · Location: {cost.workArea}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Contractor: {cost.vendorContractor || 'Direct Labour'}</span>
                    <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                      {formatCurrency(cost.totalCost, settings.currencySymbol)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cost)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold"
                      aria-label="Edit cost record"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    {canDeleteRecords && (
                      <button
                        onClick={() => setDeleteModalCost(cost)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center text-rose-500 hover:text-rose-700 active:bg-rose-50 rounded-lg border border-slate-200 text-xs"
                        aria-label="Delete cost record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View (>= md): Full Data Table with Touch Scrolling */}
        <div className="hidden md:block overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Location / Area</th>
                <th className="py-3 px-4">Contractor / Vendor</th>
                <th className="py-3 px-4 text-right">Cost (PKR)</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedCosts.map((cost) => {
                const branch = branches.find((b) => b.id === cost.branchId);

                return (
                  <tr key={cost.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(cost.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{branch?.code}</span>
                      <span className="text-[11px] text-slate-400 block">{branch?.city}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900 block">{cost.category}</span>
                      {cost.subcategory && (
                        <span className="text-[11px] text-slate-500 block">{cost.subcategory}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 min-w-[200px]">
                      <span className="font-medium text-slate-900 block">{cost.description}</span>
                      {cost.invoiceRefNumber && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Ref: {cost.invoiceRefNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{cost.workArea}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {cost.vendorContractor || 'Direct Labour'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900 whitespace-nowrap">
                      {formatCurrency(cost.totalCost, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border ${
                          cost.paymentStatus === 'Paid'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : cost.paymentStatus === 'Partial'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {cost.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cost)}
                          className="min-h-[34px] min-w-[34px] flex items-center justify-center text-slate-400 hover:text-slate-800 rounded-xs"
                          title="Edit Cost"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteRecords && (
                          <button
                            onClick={() => setDeleteModalCost(cost)}
                            className="min-h-[34px] min-w-[34px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-xs"
                            title="Delete Cost"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayedCosts.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-xs">
            No construction costing records found. Click "Add Construction Item" to log civil, interior, or fit-out works.
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isFormOpen && editingCost && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingCost.id ? 'Edit Construction Item' : 'Add Construction & Fit-out Cost'}
          subtitle="Record civil work, flooring, ceiling, painting, or contractor payments"
          maxWidth="3xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Branch *
                </label>
                <select
                  required
                  value={editingCost.branchId || ''}
                  onChange={(e) => setEditingCost({ ...editingCost, branchId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={editingCost.category || 'Civil Work'}
                  onChange={(e) => setEditingCost({ ...editingCost, category: e.target.value as ConstructionCategory })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  {CONSTRUCTION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  placeholder="e.g. Italian Porcelain Tile"
                  value={editingCost.subcategory || ''}
                  onChange={(e) => setEditingCost({ ...editingCost, subcategory: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Work Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supply and fixing of 60x120cm non-slip floor tiles with epoxy"
                  value={editingCost.description || ''}
                  onChange={(e) => setEditingCost({ ...editingCost, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Work Area / Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Dining Hall, Kitchen"
                  value={editingCost.workArea || ''}
                  onChange={(e) => setEditingCost({ ...editingCost, workArea: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Vendor / Contractor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Al-Madina Civil Builders"
                  value={editingCost.vendorContractor || ''}
                  onChange={(e) => setEditingCost({ ...editingCost, vendorContractor: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Invoice / Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-AMB-2026-44"
                  value={editingCost.invoiceRefNumber || ''}
                  onChange={(e) => setEditingCost({ ...editingCost, invoiceRefNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editingCost.date || ''}
                  onChange={(e) => setEditingCost({ ...editingCost, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              {/* Quantity / Unit rate calculation */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingCost.quantity ?? 1}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    const rate = Number(editingCost.unitRate) || 0;
                    setEditingCost({
                      ...editingCost,
                      quantity: q,
                      totalCost: rate > 0 ? q * rate : editingCost.totalCost
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  placeholder="sqft, rft, lumpsum, days"
                  value={editingCost.unit || 'sqft'}
                  onChange={(e) => setEditingCost({ ...editingCost, unit: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit Rate (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingCost.unitRate ?? 0}
                  onChange={(e) => {
                    const rate = Number(e.target.value);
                    const q = Number(editingCost.quantity) || 1;
                    setEditingCost({
                      ...editingCost,
                      unitRate: rate,
                      totalCost: q * rate
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              {/* Cost Breakdown Formulas: Material + Labour + Other */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Material Cost (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingCost.materialCost ?? 0}
                  onChange={(e) => {
                    const mat = Number(e.target.value);
                    const lab = Number(editingCost.labourCost) || 0;
                    const oth = Number(editingCost.otherCost) || 0;
                    setEditingCost({
                      ...editingCost,
                      materialCost: mat,
                      totalCost: mat + lab + oth
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Labour Cost (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingCost.labourCost ?? 0}
                  onChange={(e) => {
                    const lab = Number(e.target.value);
                    const mat = Number(editingCost.materialCost) || 0;
                    const oth = Number(editingCost.otherCost) || 0;
                    setEditingCost({
                      ...editingCost,
                      labourCost: lab,
                      totalCost: mat + lab + oth
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Other / Transport Cost (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingCost.otherCost ?? 0}
                  onChange={(e) => {
                    const oth = Number(e.target.value);
                    const mat = Number(editingCost.materialCost) || 0;
                    const lab = Number(editingCost.labourCost) || 0;
                    setEditingCost({
                      ...editingCost,
                      otherCost: oth,
                      totalCost: mat + lab + oth
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              {/* Total Computed Cost */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Total Cost (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editingCost.totalCost ?? 0}
                  onChange={(e) => setEditingCost({ ...editingCost, totalCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono font-bold bg-slate-50 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Status *
                </label>
                <select
                  value={editingCost.paymentStatus || 'Paid'}
                  onChange={(e) => setEditingCost({ ...editingCost, paymentStatus: e.target.value as PaymentStatus })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Paid Amount (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingCost.paidAmount ?? 0}
                  onChange={(e) => setEditingCost({ ...editingCost, paidAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Remarks / Engineer Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Material specs, engineer approval, warranty details..."
                  value={editingCost.remarks || ''}
                  onChange={(e) => setEditingCost({ ...editingCost, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
              >
                {editingCost.id ? 'Save Milestone' : 'Record Cost'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteModalCost && (
        <DeleteConfirmModal
          isOpen={!!deleteModalCost}
          onClose={() => setDeleteModalCost(null)}
          onConfirm={async () => {
            await deleteConstructionCost(deleteModalCost.id);
          }}
          title="Delete Construction Item"
          message={`Are you sure you want to remove this ${deleteModalCost.category} item?`}
          itemName={`${deleteModalCost.category}: ${deleteModalCost.description} (${formatCurrency(deleteModalCost.totalCost, settings.currencySymbol)})`}
        />
      )}
    </div>
  );
};
