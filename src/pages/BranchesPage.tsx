import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Calendar,
  Phone,
  User,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Branch, BranchStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { BranchFormModal } from '../components/branches/BranchFormModal';
import { formatCurrency, formatDate } from '../utils/formatters';

interface BranchesPageProps {
  onNavigateToBranchDetail?: (branchId: string) => void;
}

export const BranchesPage: React.FC<BranchesPageProps> = ({ onNavigateToBranchDetail }) => {
  const {
    branches,
    saveBranch,
    deleteBranch,
    settings,
    setSelectedBranchId,
    getBranchCostBreakdown,
    showNotification
  } = useData();
  const { canManageBranches, canDeleteBranches } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);

  // Delete modal state
  const [deleteModalBranch, setDeleteModalBranch] = useState<Branch | null>(null);

  // Filtered list
  const filteredBranches = branches.filter((b) => {
    if (!b) return false;
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      String(b.name || '').toLowerCase().includes(term) ||
      String(b.code || '').toLowerCase().includes(term) ||
      String(b.city || '').toLowerCase().includes(term) ||
      String(b.branchManager || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    if (!canManageBranches) {
      showNotification('Permission restricted: Manager or Super Manager privileges are required to create branches.', 'error');
      return;
    }
    setEditingBranch({
      code: `BR-0${branches.length + 1}`,
      name: '',
      address: '',
      city: 'Karachi',
      province: 'Sindh',
      contactNumber: '+92 21 ',
      branchManager: '',
      openingDate: new Date().toISOString().slice(0, 10),
      status: 'Setup in Progress',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (branch: Branch, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageBranches) {
      showNotification('Permission restricted: Manager or Super Manager privileges are required to edit branches.', 'error');
      return;
    }
    setEditingBranch({ ...branch });
    setIsFormOpen(true);
  };

  const getStatusColor = (status: BranchStatus) => {
    switch (status) {
      case 'Operational':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Setup in Progress':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'Under Construction':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Planning':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'Closed':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search branch name, code, city, manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium sm:inline hidden">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="Under Construction">Under Construction</option>
              <option value="Setup in Progress">Setup in Progress</option>
              <option value="Operational">Operational</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {canManageBranches && (
          <button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Branch</span>
          </button>
        )}
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredBranches.map((branch) => {
          const breakdown = getBranchCostBreakdown(branch.id);

          return (
            <div
              key={branch.id}
              onClick={() => {
                setSelectedBranchId(branch.id);
                setSelectedBranch(branch);
              }}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer shadow-xs hover:shadow-sm active:scale-[0.99]"
            >
              {/* Branch Card Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded-sm">
                      {branch.code}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border ${getStatusColor(
                        branch.status
                      )}`}
                    >
                      {branch.status}
                    </span>
                  </div>

                  {canManageBranches && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEdit(branch, e)}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 active:bg-slate-200"
                        title="Edit Branch"
                        aria-label={`Edit ${branch.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDeleteBranches && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModalBranch(branch);
                          }}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 active:bg-rose-100"
                          title="Delete Branch (Super Manager Only)"
                          aria-label={`Delete ${branch.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                  {branch.name}
                </h3>

                <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{branch.address}, {branch.city}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {branch.branchManager || 'Unassigned'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(branch.openingDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost & Asset summary strip */}
              <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">Total Setup Cost</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(breakdown.totalActual, settings.currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Budget: {formatCurrency(breakdown.estimatedBudget, settings.currencySymbol)}</span>
                  <span
                    className={`font-mono font-semibold ${
                      breakdown.isOverBudget ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {breakdown.isOverBudget
                      ? `Over Budget`
                      : `Remaining: ${formatCurrency(breakdown.remainingBudget, settings.currencySymbol)}`}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-white flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  Created {formatDate(branch.createdAt)}
                </span>
                <button
                  onClick={() => {
                    setSelectedBranchId(branch.id);
                    setSelectedBranch(branch);
                  }}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Branch Hub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBranches.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500 text-sm">
          No branches found matching your search.
        </div>
      )}

      {/* Branch Detail Inspection Modal */}
      {selectedBranch && (
        <Modal
          isOpen={!!selectedBranch}
          onClose={() => setSelectedBranch(null)}
          title={`${selectedBranch.code} - ${selectedBranch.name}`}
          subtitle={`Full Branch Setup & Asset Audit Profile (${selectedBranch.city}, ${selectedBranch.province})`}
          maxWidth="3xl"
        >
          {(() => {
            const breakdown = getBranchCostBreakdown(selectedBranch.id);
            return (
              <div className="space-y-6">
                {/* Status bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <span className="text-xs text-slate-500 block">Status:</span>
                    <span className="text-xs font-bold text-slate-900">{selectedBranch.status}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Branch Manager:</span>
                    <span className="text-xs font-bold text-slate-900">{selectedBranch.branchManager}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Target Opening Date:</span>
                    <span className="text-xs font-bold text-slate-900">{formatDate(selectedBranch.openingDate)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Phone:</span>
                    <span className="text-xs font-mono text-slate-900">{selectedBranch.contactNumber}</span>
                  </div>
                </div>

                {/* Financial Ledger Breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                    Branch Setup Financial Ledger
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Construction / Civil</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                        {formatCurrency(breakdown.construction, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Kitchen Equipment</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                        {formatCurrency(breakdown.kitchen, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">HVAC & AC</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                        {formatCurrency(breakdown.hvac, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Furniture & Fixtures</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                        {formatCurrency(breakdown.furniture, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Electrical Infrastructure</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                        {formatCurrency(breakdown.electrical, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Lighting Fixtures</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                        {formatCurrency(breakdown.lighting, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">IT & POS Systems</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                        {formatCurrency(breakdown.it_pos, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Operational Expenses</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                        {formatCurrency(breakdown.expenses, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-lg bg-emerald-950 text-emerald-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-300 block">TOTAL SETUP & FIT-OUT EXPENDITURE</span>
                      <span className="text-xl font-bold font-mono">
                        {formatCurrency(breakdown.totalActual, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-emerald-300 block">APPROVED BUDGET</span>
                      <span className="text-sm font-mono font-semibold">
                        {formatCurrency(breakdown.estimatedBudget, settings.currencySymbol)}
                      </span>
                      <span className="text-xs text-emerald-200 block mt-0.5">
                        Variance: {formatCurrency(breakdown.remainingBudget, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedBranch.notes && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-md border border-slate-200">
                    <strong className="text-slate-800 block mb-1">Branch Specifications & Scope:</strong>
                    {selectedBranch.notes}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setSelectedBranch(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Create / Edit Branch Modal */}
      <BranchFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBranch(null);
        }}
        branch={editingBranch}
        onSave={async (branchData) => {
          await saveBranch(branchData);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalBranch && (
        <DeleteConfirmModal
          isOpen={!!deleteModalBranch}
          onClose={() => setDeleteModalBranch(null)}
          onConfirm={async () => {
            await deleteBranch(deleteModalBranch.id);
          }}
          title="Delete Restaurant Branch"
          message={`Are you sure you want to delete branch '${deleteModalBranch.name}'? This will remove its setup configuration from the active system.`}
          itemName={`${deleteModalBranch.code} - ${deleteModalBranch.name}`}
        />
      )}
    </div>
  );
};
