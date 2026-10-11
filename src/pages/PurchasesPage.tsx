import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Download,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PurchaseOrder, DeliveryStatus, PaymentStatus, PurchaseOrderItem } from '../types';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { Pagination } from '../components/common/Pagination';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel } from '../utils/excel';

export const PurchasesPage: React.FC = () => {
  const {
    branches,
    suppliers,
    filteredPurchases,
    savePurchaseOrder,
    deletePurchaseOrder,
    selectedBranchId,
    settings
  } = useData();
  const { canDeleteRecords } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<Partial<PurchaseOrder> | null>(null);
  const [deleteModalPO, setDeleteModalPO] = useState<PurchaseOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setCurrentPage((prev) => (prev === 1 ? prev : 1));
  }, [searchTerm, deliveryFilter, paymentFilter, selectedBranchId]);

  const displayedPOs = useMemo(() => {
    return filteredPurchases.filter((p) => {
      if (!p) return false;
      const branch = branches.find((b) => b?.id === p.branchId);
      const term = (searchTerm || '').toLowerCase();
      const matchesSearch =
        String(p.poNumber || '').toLowerCase().includes(term) ||
        String(p.supplierName || '').toLowerCase().includes(term) ||
        String(p.invoiceNumber || '').toLowerCase().includes(term) ||
        String(branch?.name || '').toLowerCase().includes(term);

      const matchesDelivery = deliveryFilter === 'all' || p.deliveryStatus === deliveryFilter;
      const matchesPayment = paymentFilter === 'all' || p.paymentStatus === paymentFilter;

      return matchesSearch && matchesDelivery && matchesPayment;
    });
  }, [filteredPurchases, branches, searchTerm, deliveryFilter, paymentFilter]);

  const paginatedPOs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedPOs.slice(start, start + pageSize);
  }, [displayedPOs, currentPage, pageSize]);

  const totalPurchasesValue = displayedPOs.reduce((sum, p) => sum + (Number(p.grandTotal) || 0), 0);
  const totalPaid = displayedPOs.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  const totalPending = totalPurchasesValue - totalPaid;

  const handleOpenCreate = () => {
    const targetBranchId = selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '';
    const initialSupplier = suppliers[0];

    const initialItem: PurchaseOrderItem = {
      itemName: 'Commercial Stainless Steel Prep Table',
      specification: 'SS304 1800 x 700 mm',
      quantity: 2,
      unit: 'units',
      unitPrice: 65000,
      discount: 2000,
      taxPercent: 16,
      total: 148480
    };

    setEditingPO({
      branchId: targetBranchId,
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().slice(0, 10),
      supplierId: initialSupplier?.id || '',
      supplierName: initialSupplier?.name || 'General Supplier',
      category: 'Kitchen Equipment',
      items: [initialItem],
      subtotal: 130000,
      discount: 2000,
      tax: 20480,
      grandTotal: 148480,
      paymentStatus: 'Paid',
      paidAmount: 148480,
      deliveryStatus: 'Received',
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: ''
    });
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (po: PurchaseOrder) => {
    setEditingPO({ ...po });
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingPO(null);
    setSubmitError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPO || !editingPO.branchId || !editingPO.poNumber || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const sub = Number(editingPO.subtotal) || 0;
      const disc = Number(editingPO.discount) || 0;
      const tax = Number(editingPO.tax) || 0;
      const grand = sub - disc + tax;
      const paid = Number(editingPO.paidAmount) || 0;

      await savePurchaseOrder({
        ...editingPO,
        subtotal: sub,
        discount: disc,
        tax,
        grandTotal: grand,
        paidAmount: paid
      });

      // Dialog automatically closes ONLY after Firestore mutation succeeds
      setIsFormOpen(false);
      setEditingPO(null);
    } catch (err: any) {
      console.error('Failed to save purchase order:', err);
      const rawMsg = err?.message || String(err || '');
      if (
        rawMsg.includes('Missing or insufficient permissions') ||
        rawMsg.includes('permission-denied')
      ) {
        setSubmitError(
          'Permission Denied: Your account role is not authorized to edit purchase orders for this branch.'
        );
      } else {
        setSubmitError(rawMsg && rawMsg.length < 160 ? rawMsg : 'Failed to save purchase order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const exportData = displayedPOs.map((p) => {
      const branch = branches.find((b) => b.id === p.branchId);
      return {
        'PO Number': p.poNumber,
        'Branch Code': branch?.code || '',
        'Branch Name': branch?.name || '',
        'Date': formatDate(p.date),
        'Supplier': p.supplierName,
        'Category': p.category,
        'Subtotal (PKR)': p.subtotal,
        'Discount (PKR)': p.discount,
        'Tax (PKR)': p.tax,
        'Grand Total (PKR)': p.grandTotal,
        'Paid Amount (PKR)': p.paidAmount,
        'Payment Status': p.paymentStatus,
        'Delivery Status': p.deliveryStatus,
        'Invoice #': p.invoiceNumber,
        'Notes': p.notes
      };
    });
    exportToExcel(exportData, 'Purchase_Orders_Register');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-600" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block">
            Total Purchase Commitments
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">
            {formatCurrency(totalPurchasesValue, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {displayedPOs.length} PO contracts logged
          </span>
        </div>

        <div className="relative overflow-hidden p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block">
            Paid to Vendors
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block tabular-nums">
            {formatCurrency(totalPaid, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Disbursed vendor payments
          </span>
        </div>

        <div className="relative overflow-hidden p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block">
            Outstanding Payment Balance
          </span>
          <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block tabular-nums">
            {formatCurrency(totalPending, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Vendor pending payables
          </span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search PO#, supplier, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden transition-all"
            />
          </div>

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden transition-all"
          >
            <option value="all">All Delivery Statuses</option>
            <option value="Received">Received</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Ordered">Ordered</option>
            <option value="Draft">Draft</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden transition-all"
          >
            <option value="all">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="min-h-[38px] px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="min-h-[38px] px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* PO Display: Desktop Table + Mobile Responsive Cards */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">PO Number / Date</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax (16%)</th>
                <th className="py-3 px-4 text-right">Grand Total (PKR)</th>
                <th className="py-3 px-4 text-center">Delivery</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPOs.map((po) => {
                const branch = branches.find((b) => b.id === po.branchId);

                return (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{po.poNumber}</span>
                      <span className="text-[11px] text-slate-400 block">{formatDate(po.date)}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{branch?.code}</span>
                      <span className="text-[11px] text-slate-400 block">{branch?.city}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {po.supplierName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {po.category}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatCurrency(po.subtotal, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                      {formatCurrency(po.tax, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(po.grandTotal, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border ${
                          po.deliveryStatus === 'Received'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : po.deliveryStatus === 'Partially Received'
                            ? 'text-sky-700 bg-sky-50 border-sky-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {po.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border ${
                          po.paymentStatus === 'Paid'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : po.paymentStatus === 'Partial'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {po.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(po)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                          title="Edit PO"
                          aria-label={`Edit ${po.poNumber}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteRecords && (
                          <button
                            onClick={() => setDeleteModalPO(po)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            title="Delete PO"
                            aria-label={`Delete ${po.poNumber}`}
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

        {/* Mobile Phone Cards View (Optimized for 320px - 767px) */}
        <div className="block md:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-2.5">
          {paginatedPOs.map((po) => {
            const branch = branches.find((b) => b.id === po.branchId);

            return (
              <div
                key={po.id}
                className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 space-y-2 text-xs"
              >
                {/* Header: PO Number + Date + Status Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm block">{po.poNumber}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(po.date)} · {po.category}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${
                        po.deliveryStatus === 'Received'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {po.deliveryStatus}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border ${
                        po.paymentStatus === 'Paid'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}
                    >
                      {po.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Details snippet */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-md border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Supplier</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">{po.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Branch Target</span>
                    <span className="font-semibold text-slate-800">{branch?.code || 'All Branches'}</span>
                  </div>
                </div>

                {/* Amount strip */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 font-mono">
                  <div className="text-slate-500 text-[11px]">
                    Subtotal: {formatCurrency(po.subtotal, settings.currencySymbol)} (Tax: {formatCurrency(po.tax, settings.currencySymbol)})
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-sans block">Grand Total</span>
                    <span className="font-bold text-slate-900 text-sm">{formatCurrency(po.grandTotal, settings.currencySymbol)}</span>
                  </div>
                </div>

                {/* Touch actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    onClick={() => handleOpenEdit(po)}
                    className="min-h-[36px] px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1 active:bg-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit PO</span>
                  </button>
                  {canDeleteRecords && (
                    <button
                      onClick={() => setDeleteModalPO(po)}
                      className="min-h-[36px] px-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md flex items-center gap-1 active:bg-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {displayedPOs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No purchase orders found. Click "New Purchase Order" to generate an official equipment or supply purchase.
          </div>
        ) : (
          <Pagination
            currentPage={currentPage}
            totalItems={displayedPOs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Create / Edit PO Modal */}
      {isFormOpen && editingPO && (
        <Modal
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          title={editingPO.id ? `Edit Purchase Order (${editingPO.poNumber})` : 'New Purchase Order'}
          subtitle="Generate purchase request, calculate taxes and delivery schedule"
          maxWidth="3xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium leading-relaxed">{submitError}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Branch *
                </label>
                <select
                  required
                  value={editingPO.branchId || ''}
                  onChange={(e) => setEditingPO({ ...editingPO, branchId: e.target.value })}
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
                  PO Number *
                </label>
                <input
                  type="text"
                  required
                  value={editingPO.poNumber || ''}
                  onChange={(e) => setEditingPO({ ...editingPO, poNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  value={editingPO.date || ''}
                  onChange={(e) => setEditingPO({ ...editingPO, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Supplier / Vendor *
                </label>
                <select
                  required
                  value={editingPO.supplierId || ''}
                  onChange={(e) => {
                    const sup = suppliers.find((s) => s.id === e.target.value);
                    setEditingPO({
                      ...editingPO,
                      supplierId: e.target.value,
                      supplierName: sup ? sup.name : ''
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Kitchen Equipment, HVAC, Electrical..."
                  value={editingPO.category || ''}
                  onChange={(e) => setEditingPO({ ...editingPO, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Invoice / Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-ARK-2026-90"
                  value={editingPO.invoiceNumber || ''}
                  onChange={(e) => setEditingPO({ ...editingPO, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              {/* Financial Auto Calculations */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subtotal (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editingPO.subtotal ?? 0}
                  onChange={(e) => {
                    const sub = Number(e.target.value);
                    const disc = Number(editingPO.discount) || 0;
                    const tax = Number((sub * (settings.taxRate / 100)).toFixed(0));
                    setEditingPO({
                      ...editingPO,
                      subtotal: sub,
                      tax,
                      grandTotal: sub - disc + tax
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Discount (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingPO.discount ?? 0}
                  onChange={(e) => {
                    const disc = Number(e.target.value);
                    const sub = Number(editingPO.subtotal) || 0;
                    const tax = Number(editingPO.tax) || 0;
                    setEditingPO({
                      ...editingPO,
                      discount: disc,
                      grandTotal: sub - disc + tax
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sales Tax (16% PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingPO.tax ?? 0}
                  onChange={(e) => {
                    const tax = Number(e.target.value);
                    const sub = Number(editingPO.subtotal) || 0;
                    const disc = Number(editingPO.discount) || 0;
                    setEditingPO({
                      ...editingPO,
                      tax,
                      grandTotal: sub - disc + tax
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Calculated Grand Total (PKR)
                </label>
                <input
                  type="number"
                  readOnly
                  value={(Number(editingPO.subtotal) || 0) - (Number(editingPO.discount) || 0) + (Number(editingPO.tax) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono font-bold bg-slate-50 text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Delivery Status *
                </label>
                <select
                  value={editingPO.deliveryStatus || 'Received'}
                  onChange={(e) => setEditingPO({ ...editingPO, deliveryStatus: e.target.value as DeliveryStatus })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="Draft">Draft</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Partially Received">Partially Received</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Status *
                </label>
                <select
                  value={editingPO.paymentStatus || 'Paid'}
                  onChange={(e) => setEditingPO({ ...editingPO, paymentStatus: e.target.value as PaymentStatus })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Order Notes & Delivery Challan Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Terms, warranty conditions, gate pass references..."
                  value={editingPO.notes || ''}
                  onChange={(e) => setEditingPO({ ...editingPO, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCloseForm}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {isSubmitting
                    ? 'Saving...'
                    : editingPO.id
                    ? 'Save Purchase Order'
                    : 'Issue Purchase Order'}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteModalPO && (
        <DeleteConfirmModal
          isOpen={!!deleteModalPO}
          onClose={() => setDeleteModalPO(null)}
          onConfirm={async () => {
            await deletePurchaseOrder(deleteModalPO.id);
          }}
          title="Delete Purchase Order"
          message={`Are you sure you want to delete PO '${deleteModalPO.poNumber}'?`}
          itemName={`${deleteModalPO.poNumber} - ${deleteModalPO.supplierName} (${formatCurrency(deleteModalPO.grandTotal, settings.currencySymbol)})`}
        />
      )}
    </div>
  );
};
