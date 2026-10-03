import React, { useState, useMemo } from 'react';
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
  ArrowRightLeft
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { InventoryItem, StockTransactionType } from '../types';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
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

  // Stock Transaction Modal
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [activeTxnItem, setActiveTxnItem] = useState<InventoryItem | null>(null);
  const [txnType, setTxnType] = useState<StockTransactionType>('STOCK_IN');
  const [txnQty, setTxnQty] = useState<number>(10);
  const [txnReason, setTxnReason] = useState<string>('');
  const [txnTargetBranch, setTxnTargetBranch] = useState<string>('');
  const [txnRef, setTxnRef] = useState<string>('');

  const displayedInventory = useMemo(() => {
    return filteredInventory.filter((item) => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase());

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
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem({ ...item });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.itemName || !editingItem.branchId) return;

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

    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenTransaction = (item: InventoryItem, type: StockTransactionType) => {
    setActiveTxnItem(item);
    setTxnType(type);
    setTxnQty(type === 'STOCK_IN' ? 10 : 5);
    setTxnReason(type === 'STOCK_IN' ? 'Supplier Delivery Restock' : 'Issued to Kitchen / Service');
    setTxnRef(`TXN-${Date.now().toString().slice(-5)}`);
    setIsTxnModalOpen(true);
  };

  const handleExecuteTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTxnItem) return;

    await recordStockTransaction({
      inventoryItemId: activeTxnItem.id,
      transactionType: txnType,
      quantity: Number(txnQty),
      reason: txnReason,
      targetBranchId: txnTargetBranch,
      referenceNumber: txnRef
    });

    setIsTxnModalOpen(false);
    setActiveTxnItem(null);
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
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Total Active SKUs</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {totalSKUs} items
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Tracked food, packaging & supplies</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Total Inventory Valuation</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(totalStockValue, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Live balance in stock</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Low Stock Alerts</span>
          <span
            className={`text-xl font-bold font-mono mt-1 block ${
              lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {lowStockCount} below minimum
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Reorder threshold breached</span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU code, name, supplier..."
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
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={stockLevelFilter}
            onChange={(e) => setStockLevelFilter(e.target.value as any)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock</option>
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
            onClick={handleOpenCreateItem}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Inventory Display: Desktop Table + Mobile Responsive Cards */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
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
              {displayedInventory.map((item) => {
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
          {displayedInventory.map((item) => {
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

        {displayedInventory.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-xs">
            No inventory items found. Click "New Inventory Item" to register stock.
          </div>
        )}
      </div>

      {/* Stock Transaction Modal (Stock In / Out / Adjust / Transfer) */}
      {isTxnModalOpen && activeTxnItem && (
        <Modal
          isOpen={isTxnModalOpen}
          onClose={() => setIsTxnModalOpen(false)}
          title={`Record Stock ${txnType.replace('_', ' ')}`}
          subtitle={`Item: ${activeTxnItem.itemName} (${activeTxnItem.itemCode}) · Current: ${activeTxnItem.currentStock} ${activeTxnItem.unit}`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteTransaction} className="space-y-4">
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
                onClick={() => setIsTxnModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
              >
                Confirm Transaction
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create / Edit Inventory SKU Modal */}
      {isItemModalOpen && editingItem && (
        <Modal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          title={editingItem.id ? 'Edit Inventory SKU' : 'New Inventory Item'}
          subtitle="Configure stock thresholds, units, and supplier details"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveItem} className="space-y-4">
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
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
              >
                {editingItem.id ? 'Save Changes' : 'Create Item'}
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
