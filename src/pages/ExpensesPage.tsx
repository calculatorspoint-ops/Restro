import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Calendar,
  DollarSign,
  Edit2,
  Trash2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Expense, ExpenseCategory } from '../types';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel } from '../utils/excel';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Labour',
  'Transportation',
  'Utilities',
  'Rent',
  'Maintenance',
  'Construction',
  'Electrical',
  'Furniture',
  'HVAC',
  'Kitchen',
  'IT',
  'Other'
];

export const ExpensesPage: React.FC = () => {
  const {
    branches,
    filteredExpenses,
    saveExpense,
    deleteExpense,
    selectedBranchId,
    settings
  } = useData();
  const { canDeleteRecords } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
  const [deleteModalExpense, setDeleteModalExpense] = useState<Expense | null>(null);

  const displayedExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => {
      const branch = branches.find((b) => b.id === e.branchId);
      const matchesSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.paidBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
      const matchesMethod = methodFilter === 'all' || e.paymentMethod === methodFilter;

      return matchesSearch && matchesCat && matchesMethod;
    });
  }, [filteredExpenses, branches, searchTerm, categoryFilter, methodFilter]);

  const totalExpenseAmount = displayedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleOpenCreate = () => {
    const targetBranchId = selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '';
    setEditingExpense({
      branchId: targetBranchId,
      date: new Date().toISOString().slice(0, 10),
      category: 'Labour',
      description: '',
      amount: 50000,
      paidBy: 'Site Manager',
      paymentMethod: 'Cash',
      vendor: '',
      referenceNumber: `VOUCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      remarks: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense({ ...exp });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.branchId || !editingExpense.description) return;

    await saveExpense({
      ...editingExpense,
      amount: Number(editingExpense.amount) || 0
    });

    setIsFormOpen(false);
    setEditingExpense(null);
  };

  const handleExport = () => {
    const exportData = displayedExpenses.map((e) => {
      const branch = branches.find((b) => b.id === e.branchId);
      return {
        'Expense ID': e.id,
        'Branch Code': branch?.code || '',
        'Branch Name': branch?.name || '',
        'Date': formatDate(e.date),
        'Category': e.category,
        'Description': e.description,
        'Amount (PKR)': e.amount,
        'Paid By': e.paidBy,
        'Payment Method': e.paymentMethod,
        'Vendor / Payee': e.vendor,
        'Reference #': e.referenceNumber,
        'Remarks': e.remarks
      };
    });
    exportToExcel(exportData, 'Operational_Expenses_Voucher_Report');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Total Expense Vouchers</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {displayedExpenses.length} vouchers
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Disbursements logged</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Total Expense Amount</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(totalExpenseAmount, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Audit verified</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Average Per Voucher</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(
              displayedExpenses.length > 0 ? totalExpenseAmount / displayedExpenses.length : 0,
              settings.currencySymbol
            )}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Per petty cash transaction</span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, payee, ref..."
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
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Online">Online</option>
            <option value="Credit Card">Credit Card</option>
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
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Expenses Display: Desktop Table + Mobile Responsive Cards */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Vendor / Payee</th>
                <th className="py-3 px-4">Paid By / Method</th>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedExpenses.map((exp) => {
                const branch = branches.find((b) => b.id === exp.branchId);

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{branch?.code}</span>
                      <span className="text-[11px] text-slate-400 block">{branch?.city}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                      {exp.category}
                    </td>
                    <td className="py-3 px-4 min-w-[200px] text-slate-700">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-800">
                      {exp.vendor || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-800 block">{exp.paidBy}</span>
                      <span className="text-[11px] text-slate-400 block">{exp.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {exp.referenceNumber}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(exp.amount, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                          title="Edit Expense"
                          aria-label={`Edit ${exp.description}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteRecords && (
                          <button
                            onClick={() => setDeleteModalExpense(exp)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            title="Delete Expense"
                            aria-label={`Delete ${exp.description}`}
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
          {displayedExpenses.map((exp) => {
            const branch = branches.find((b) => b.id === exp.branchId);

            return (
              <div
                key={exp.id}
                className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 space-y-2 text-xs"
              >
                {/* Header: Description + Category + Date */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{exp.description}</h4>
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatDate(exp.date)} · Ref: {exp.referenceNumber}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-white border border-slate-200 text-slate-800 shrink-0">
                    {exp.category}
                  </span>
                </div>

                {/* Details snippet */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-md border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Branch & Payee</span>
                    <span className="font-semibold text-slate-800">{branch?.code || 'Consolidated'}</span> · {exp.vendor || 'Direct Pay'}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Paid By / Method</span>
                    <span className="text-slate-800 font-medium">{exp.paidBy}</span> ({exp.paymentMethod})
                  </div>
                </div>

                {/* Amount strip */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 font-mono">
                  <span className="text-slate-400 text-[10px] font-sans">Voucher Total:</span>
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(exp.amount, settings.currencySymbol)}</span>
                </div>

                {/* Touch actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    onClick={() => handleOpenEdit(exp)}
                    className="min-h-[36px] px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1 active:bg-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  {canDeleteRecords && (
                    <button
                      onClick={() => setDeleteModalExpense(exp)}
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

        {displayedExpenses.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-xs">
            No expenses found. Click "Record Expense" to log daily site disbursements or operational bills.
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isFormOpen && editingExpense && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingExpense.id ? 'Edit Expense Voucher' : 'Record Branch Expense'}
          subtitle="Log labour, transport, utilities, maintenance, or miscellaneous costs"
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Branch *
                </label>
                <select
                  required
                  value={editingExpense.branchId || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, branchId: e.target.value })}
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
                  value={editingExpense.category || 'Labour'}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as ExpenseCategory })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily wages for 6 site labourers clearing rubble"
                  value={editingExpense.description || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editingExpense.amount ?? 0}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editingExpense.date || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Paid By *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood (Site Manager)"
                  value={editingExpense.paidBy || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, paidBy: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={editingExpense.paymentMethod || 'Cash'}
                  onChange={(e) => setEditingExpense({ ...editingExpense, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Vendor / Payee
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily Wage Contractor, K-Electric"
                  value={editingExpense.vendor || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, vendor: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Voucher / Receipt Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. VOUCH-2026-90"
                  value={editingExpense.referenceNumber || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Remarks / Purpose
                </label>
                <input
                  type="text"
                  placeholder="Petty cash details, approval notes..."
                  value={editingExpense.remarks || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, remarks: e.target.value })}
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
                {editingExpense.id ? 'Save Voucher' : 'Record Expense'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteModalExpense && (
        <DeleteConfirmModal
          isOpen={!!deleteModalExpense}
          onClose={() => setDeleteModalExpense(null)}
          onConfirm={async () => {
            await deleteExpense(deleteModalExpense.id);
          }}
          title="Delete Expense Record"
          message={`Are you sure you want to remove expense '${deleteModalExpense.description}'?`}
          itemName={`${deleteModalExpense.referenceNumber} - ${formatCurrency(deleteModalExpense.amount, settings.currencySymbol)}`}
        />
      )}
    </div>
  );
};
