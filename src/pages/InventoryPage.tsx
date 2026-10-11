import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Download,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Edit2,
  Trash2,
  ArrowRightLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { InventoryItem, StockTransactionType } from '../types';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { Pagination } from '../components/common/Pagination';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { exportToExcel } from '../utils/excel';

export const InventoryPage: React.FC = () => {
  const {
    branches,
    filteredInventory,
    stockTransactions,
    saveInventoryItem,
    deleteInventoryItem,
    recordStockTransaction,
    selectedBranchId,
    settings
  } = useData();
  const { canDeleteRecords } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'low' | 'out'>('all');

  // Item form modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage((prev) => (prev === 1 ? prev : 1));
  }, [searchTerm, categoryFilter, stockLevelFilter, selectedBranchId]);

  // Stock Transaction Modal
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [activeTxnItem, setActiveTxnItem] = useState<InventoryItem | null>(null);
  const [txnType, setTxnType] = useState<StockTransactionType>('STOCK_IN');
  const [txnQty, setTxnQty] = useState<number>(10);
  const [txnReason, setTxnReason] = useState<string>('');
  const [txnTargetBranch, setTxnTargetBranch] = useState<string>('');
  const [txnRef, setTxnRef] = useState<string>('');
  const [txnError, setTxnError] = useState<string | null>(null);

  const displayedInventory = useMemo(() => {
    return filteredInventory.filter((item) => {
      if (!item) return false;
      const term = (searchTerm || '').toLowerCase();
      const matchesSearch =
        String(item.itemName || '').toLowerCase().includes(term) ||
        String(item.itemCode || '').toLowerCase().includes(term) ||
        String(item.supplierName || '').toLowerCase().includes(term) ||
        String(item.warehouseLocation || '').toLowerCase().includes(term);

      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;

      let matchesLevel = true;
      if (stockLevelFilter === 'low') {
        matchesLevel = item.currentStock <= item.minimumLevel && item.currentStock > 0;
      } else if (stockLevelFilter === 'out') {
        matchesLevel = item.currentStock <= 0;
      }

      return matchesSearch && matchesCat && matchesLevel;
    });
  }, [filteredInventory, searchTerm, categoryFilter, stockLevelFilter]);

  // High-performance paginated slice
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedInventory.slice(start, start + pageSize);
  }, [displayedInventory, currentPage, pageSize]);

  const categories = useMemo(() => {
    return Array.from(new Set(filteredInventory.map((i) => i.category))).filter(Boolean);
  }, [filteredInventory]);

  const totalSKUs = displayedInventory.length;
  const totalStockValue = displayedInventory.reduce((sum, i) => sum + (Number(i.stockValue) || 0), 0);
  const lowStockCount = displayedInventory.filter((i) => i.currentStock <= i.minimumLevel).length;

  const handleOpenCreateItem = () => {
    const targetBranchId = selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '';
    setEditingItem({
      branchId: targetBranchId,
      itemCode: `INV-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      itemName: '',
      category: 'Packaging',
      subcategory: '',
      unit: 'cartons',
      warehouseLocation: 'Dry Store',
      openingStock: 10,
      stockIn: 0,
      stockOut: 0,
      adjustments: 0,
      currentStock: 10,
      minimumLevel: 5,
      reorderLevel: 10,
      unitCost: 1500,
      stockValue: 15000,
      supplierName: '',
      remarks: ''
    });
    setSubmitError(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem({ ...item });
    setSubmitError(null);
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    if (isSubmitting) return;
    setIsItemModalOpen(false);
    setEditingItem(null);
    setSubmitError(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.itemName || !editingItem.branchId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const open = Number(editingItem.openingStock) || 0;
      const inQty = Number(editingItem.stockIn) || 0;
      const outQty = Number(editingItem.stockOut) || 0;
      const adj = Number(editingItem.adjustments) || 0;
      const cost = Number(editingItem.unitCost) || 0;

      const current = open + inQty - outQty + adj;
      const value = current * cost;

      await saveInventoryItem({
        ...editingItem,
        openingStock: open,
        stockIn: inQty,
        stockOut: outQty,
        adjustments: adj,
        currentStock: current,
        unitCost: cost,
        stockValue: value
      });

      // Dialog automatically closes ONLY after Firestore mutation succeeds
      setIsItemModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error('Failed to save inventory item:', err);
      const rawMsg = err?.message || String(err || '');
      if (
        rawMsg.includes('Missing or insufficient permissions') ||
        rawMsg.includes('permission-denied')
      ) {
        setSubmitError(
          'Permission Denied: Your account role is not authorized to edit inventory for this branch.'
        );
      } else {
        setSubmitError(rawMsg && rawMsg.length < 160 ? rawMsg : 'Failed to save inventory SKU. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTransaction = (item: InventoryItem, type: StockTransactionType) => {
    setActiveTxnItem(item);
    setTxnType(type);
    setTxnQty(type === 'STOCK_IN' ? 10 : 5);
    setTxnReason(type === 'STOCK_IN' ? 'Supplier Delivery Restock' : 'Issued to Kitchen / Service');
    setTxnRef(`TXN-${Date.now().toString().slice(-5)}`);
    setTxnError(null);
    setIsTxnModalOpen(true);
  };

  const handleExecuteTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTxnItem || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setTxnError(null);
      await recordStockTransaction({
        inventoryItemId: activeTxnItem.id,
        transactionType: txnType,
        quantity: Number(txnQty),
        reason: txnReason,
        targetBranchId: txnTargetBranch,
        referenceNumber: txnRef
      });

      // Dialog automatically closes ONLY after Firestore mutation succeeds
      setIsTxnModalOpen(false);
      setActiveTxnItem(null);
    } catch (err: any) {
      console.error('Failed to record stock transaction:', err);
      const rawMsg = err?.message || String(err || '');
      if (
        rawMsg.includes('Missing or insufficient permissions') ||
        rawMsg.includes('permission-denied')
      ) {
        setTxnError(
          'Permission Denied: Your account role does not have authorization to adjust inventory stock.'
        );
      } else {
        setTxnError(
          rawMsg && rawMsg.length < 160 ? rawMsg : 'Failed to record stock transaction. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const exportData = displayedInventory.map((i) => {
      const branch = branches.find((b) => b.id === i.branchId);
      return {
        'Item Code': i.itemCode,
        'Item Name': i.itemName,
        'Branch Code': branch?.code || '',
        'Branch Name': branch?.name || '',
        'Category': i.category,
        'Subcategory': i.subcategory || '',
        'Unit': i.unit,
        'Warehouse Location': i.warehouseLocation,
        'Opening Stock': i.openingStock,
        'Stock In': i.stockIn,
        'Stock Out': i.stockOut,
        'Adjustments': i.adjustments,
        'Current Stock': i.currentStock,
        'Minimum Level': i.minimumLevel,
        'Reorder Level': i.reorderLevel,
        'Unit Cost (PKR)': i.unitCost,
        'Stock Value (PKR)': i.stockValue,
        'Supplier': i.supplierName,
        'Remarks': i.remarks
      };
    });
    exportToExcel(exportData, 'Inventory_Valuation_Report');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-600" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block">
            Total Active SKUs
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">
            {totalSKUs} <span className="text-sm font-sans font-normal text-slate-500">items</span>
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Tracked consumables, packaging & ingredients
          </span>
        </div>

        <div className="relative overflow-hidden p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block">
            Total Inventory Valuation
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block tabular-nums">
            {formatCurrency(totalStockValue, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Live balance in warehouse storage
          </span>
        </div>

        <div className="relative overflow-hidden p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className={`absolute top-0 left-0 right-0 h-[2px] ${lowStockCount > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block">
            Stock Health Status
          </span>
          <span
            className={`text-2xl font-bold font-mono mt-1 block tabular-nums ${
              lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {lowStockCount}{' '}
            <span className="text-sm font-sans font-normal text-slate-500">
              {lowStockCount === 1 ? 'item low' : 'items below min'}
            </span>
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {lowStockCount > 0 ? 'Reorder threshold triggered' : 'All SKUs above minimum threshold'}
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
              placeholder="Search SKU code, name, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden transition-all"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden transition-all"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={stockLevelFilter}
            onChange={(e) => setStockLevelFilter(e.target.value as any)}
            className="py-2 px-3 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden transition-all"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock</option>
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
            onClick={handleOpenCreateItem}
            className="min-h-[38px] px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Inventory Display: Desktop Table + Mobile Responsive Cards */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Item Code / Name</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Min / Reorder</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
                <th className="py-3 px-4 text-right">Stock Value (PKR)</th>
                <th className="py-3 px-4 text-center">Quick Stock Action</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInventory.map((item) => {
                const branch = branches.find((b) => b.id === item.branchId);
                const isLow = item.currentStock <= item.minimumLevel;
                const isOut = item.currentStock <= 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{item.itemName}</span>
                      <span className="text-[11px] font-mono text-slate-400 block">{item.itemCode}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{branch?.code}</span>
                      <span className="text-[11px] text-slate-400 block">{branch?.city}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {item.warehouseLocation}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-slate-500 text-[11px]">{item.unit}</span>
                        {isLow && (
                          <span title="Low Stock Warning">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      Min: {item.minimumLevel} · Reorder: {item.reorderLevel}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatCurrency(item.unitCost, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(item.stockValue, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenTransaction(item, 'STOCK_IN')}
                          className="min-h-[32px] px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200"
                          title="Record Stock In"
                        >
                          + In
                        </button>
                        <button
                          onClick={() => handleOpenTransaction(item, 'STOCK_OUT')}
                          className="min-h-[32px] px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200"
                          title="Record Stock Out"
                        >
                          - Out
                        </button>
                        <button
                          onClick={() => handleOpenTransaction(item, 'ADJUSTMENT')}
                          className="min-h-[32px] px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                          title="Adjust"
                        >
                          Adj
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                          title="Edit SKU"
                          aria-label={`Edit ${item.itemName}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteRecords && (
                          <button
                            onClick={() => setDeleteModalItem(item)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            title="Delete Item"
                            aria-label={`Delete ${item.itemName}`}
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
          {paginatedInventory.map((item) => {
            const branch = branches.find((b) => b.id === item.branchId);
            const isLow = item.currentStock <= item.minimumLevel;
            const isOut = item.currentStock <= 0;

            return (
              <div
                key={item.id}
                className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 space-y-2.5 text-xs"
              >
                {/* Header: Item name + SKU + Branch */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.itemName}</h4>
                    <span className="font-mono text-[10px] text-slate-400">{item.itemCode} · {item.category}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-white border border-slate-200 text-slate-700 font-semibold shrink-0">
                    {branch?.code || 'Consolidated'}
                  </span>
                </div>

                {/* Stock Level Display */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-md border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Current Stock</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-lg font-bold font-mono ${
                          isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                        }`}
                      >
                        {item.currentStock}
                      </span>
                      <span className="text-slate-500 font-medium">{item.unit}</span>
                      {isLow && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-xs border border-amber-200">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Valuation</span>
                    <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                      {formatCurrency(item.stockValue, settings.currencySymbol)}
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      @{formatCurrency(item.unitCost, settings.currencySymbol)} / {item.unit}
                    </span>
                  </div>
                </div>

                {/* Touch Quick Stock Action Buttons (Thumb-friendly) */}
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">
                    Quick Stock Movements
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenTransaction(item, 'STOCK_IN')}
                      className="min-h-[42px] px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded-lg border border-emerald-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>+ Stock In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenTransaction(item, 'STOCK_OUT')}
                      className="min-h-[42px] px-2 py-1 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-lg border border-rose-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>- Stock Out</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenTransaction(item, 'ADJUSTMENT')}
                      className="min-h-[42px] px-2 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-300 flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>Adjust</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Location & Edit SKU */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                  <span>Location: <strong className="text-slate-700">{item.warehouseLocation}</strong></span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditItem(item)}
                      className="min-h-[36px] px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1 active:bg-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {canDeleteRecords && (
                      <button
                        onClick={() => setDeleteModalItem(item)}
                        className="min-h-[36px] px-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md flex items-center gap-1 active:bg-rose-200"
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

        {displayedInventory.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No inventory items found. Click "New Inventory Item" to register stock.
          </div>
        ) : (
          <Pagination
            currentPage={currentPage}
            totalItems={displayedInventory.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Stock Transaction Modal (Stock In / Out / Adjust / Transfer) */}
      {isTxnModalOpen && activeTxnItem && (
        <Modal
          isOpen={isTxnModalOpen}
          onClose={() => { if (!isSubmitting) setIsTxnModalOpen(false); }}
          title={`Record Stock ${txnType.replace('_', ' ')}`}
          subtitle={`Item: ${activeTxnItem.itemName} (${activeTxnItem.itemCode}) · Current: ${activeTxnItem.currentStock} ${activeTxnItem.unit}`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteTransaction} className="space-y-4">
            {txnError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{txnError}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Transaction Type
              </label>
              <select
                value={txnType}
                onChange={(e) => setTxnType(e.target.value as StockTransactionType)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
              >
                <option value="STOCK_IN">STOCK IN (Received from supplier / delivery)</option>
                <option value="STOCK_OUT">STOCK OUT (Issued to kitchen / front bar)</option>
                <option value="TRANSFER">TRANSFER (Send to another branch)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Audit count discrepancy / waste)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Quantity ({activeTxnItem.unit}) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={txnQty}
                onChange={(e) => setTxnQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono font-bold focus:outline-hidden"
              />
            </div>

            {txnType === 'TRANSFER' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Destination Branch *
                </label>
                <select
                  required
                  value={txnTargetBranch}
                  onChange={(e) => setTxnTargetBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="">Select Target Branch...</option>
                  {branches
                    .filter((b) => b.id !== activeTxnItem.branchId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Voucher / Dispatch Reference #
              </label>
              <input
                type="text"
                placeholder="e.g. GRN-2026-99"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Weekly routine supply from Chenab"
                value={txnReason}
                onChange={(e) => setTxnReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsTxnModalOpen(false)}
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
                <span>{isSubmitting ? 'Recording...' : 'Confirm Transaction'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create / Edit Inventory SKU Modal */}
      {isItemModalOpen && editingItem && (
        <Modal
          isOpen={isItemModalOpen}
          onClose={handleCloseItemModal}
          title={editingItem.id ? 'Edit Inventory SKU' : 'New Inventory Item'}
          subtitle="Configure stock thresholds, units, and supplier details"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveItem} className="space-y-4">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium leading-relaxed">{submitError}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Branch *
                </label>
                <select
                  required
                  value={editingItem.branchId || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, branchId: e.target.value })}
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
                  Item SKU Code *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.itemCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Item Description / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom Kraft Paper Meal Boxes 1000ml"
                  value={editingItem.itemName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  placeholder="Packaging, Cleaning, Raw Materials..."
                  value={editingItem.category || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit of Measurement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="cartons, kg bags, pcs, packs, liters"
                  value={editingItem.unit || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Storage / Warehouse Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dry Store, Cold Room, Kitchen Rack"
                  value={editingItem.warehouseLocation || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, warehouseLocation: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Opening Stock Balance
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingItem.openingStock ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, openingStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Minimum Stock Warning Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingItem.minimumLevel ?? 5}
                  onChange={(e) => setEditingItem({ ...editingItem, minimumLevel: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reorder Trigger Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingItem.reorderLevel ?? 10}
                  onChange={(e) => setEditingItem({ ...editingItem, reorderLevel: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit Cost (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editingItem.unitCost ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, unitCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Preferred Supplier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chenab Packaging"
                  value={editingItem.supplierName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editingItem.remarks || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCloseItemModal}
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
                <span>{isSubmitting ? 'Saving...' : editingItem.id ? 'Save Changes' : 'Create Item'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteModalItem && (
        <DeleteConfirmModal
          isOpen={!!deleteModalItem}
          onClose={() => setDeleteModalItem(null)}
          onConfirm={async () => {
            await deleteInventoryItem(deleteModalItem.id);
          }}
          title="Delete Inventory SKU"
          message={`Are you sure you want to delete '${deleteModalItem.itemName}'?`}
          itemName={`${deleteModalItem.itemCode} - ${deleteModalItem.itemName}`}
        />
      )}
    </div>
  );
};
