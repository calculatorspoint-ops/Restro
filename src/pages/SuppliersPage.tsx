import React, { useState, useMemo } from 'react';
import {
  Users2,
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  DollarSign,
  FileText
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Supplier } from '../types';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { formatCurrency } from '../utils/formatters';
import { exportToExcel } from '../utils/excel';

export const SuppliersPage: React.FC = () => {
  const { suppliers, purchases, saveSupplier, deleteSupplier, settings } = useData();
  const { canDeleteRecords } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [deleteModalSupplier, setDeleteModalSupplier] = useState<Supplier | null>(null);
  const [viewHistorySupplier, setViewHistorySupplier] = useState<Supplier | null>(null);

  const displayedSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ntnTaxNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [suppliers, searchTerm]);

  // Aggregate
  const totalVendors = displayedSuppliers.length;
  const totalVolume = displayedSuppliers.reduce((sum, s) => sum + (Number(s.totalPurchases) || 0), 0);
  const totalPayable = displayedSuppliers.reduce((sum, s) => sum + (Number(s.outstandingAmount) || 0), 0);

  const handleOpenCreate = () => {
    setEditingSupplier({
      name: '',
      contactPerson: '',
      phone: '+92 ',
      email: '',
      address: '',
      city: 'Karachi',
      ntnTaxNumber: '',
      paymentTerms: 'Net 30 Days',
      category: 'Commercial Kitchens',
      notes: '',
      totalPurchases: 0,
      paidAmount: 0,
      outstandingAmount: 0
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier({ ...sup });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editingSupplier.name) return;

    await saveSupplier(editingSupplier);
    setIsFormOpen(false);
    setEditingSupplier(null);
  };

  const handleExport = () => {
    const exportData = displayedSuppliers.map((s) => ({
      'Supplier ID': s.id,
      'Company Name': s.name,
      'Contact Person': s.contactPerson,
      'Phone': s.phone,
      'Email': s.email,
      'Address': s.address,
      'City': s.city,
      'NTN / Tax #': s.ntnTaxNumber,
      'Payment Terms': s.paymentTerms,
      'Category': s.category,
      'Total Purchases (PKR)': s.totalPurchases,
      'Paid (PKR)': s.paidAmount,
      'Outstanding (PKR)': s.outstandingAmount,
      'Notes': s.notes
    }));
    exportToExcel(exportData, 'Vendor_Supplier_Directory');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Registered Suppliers & Contractors</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {totalVendors} vendors
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Approved commercial partners</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Total Historical Volume</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(totalVolume, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">All equipment & fit-out contracts</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Outstanding Payables</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(totalPayable, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Pending vendor invoices</span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name, contact person, city, NTN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden"
          />
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
            <span>Register Supplier</span>
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">City / Address</th>
                <th className="py-3 px-4">NTN / Tax #</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4 text-right">Total Business (PKR)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{sup.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono block">{sup.id}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                    {sup.category}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-slate-800 block">{sup.contactPerson}</span>
                    <span className="text-[11px] font-mono text-slate-500 block">{sup.phone}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-800 block">{sup.city}</span>
                    <span className="text-[11px] text-slate-400 block line-clamp-1">{sup.address}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {sup.ntnTaxNumber || 'Exempt / N/A'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                    {sup.paymentTerms}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(sup.totalPurchases, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewHistorySupplier(sup)}
                        className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xs border border-emerald-200"
                        title="View Purchase History"
                      >
                        History
                      </button>
                      <button
                        onClick={() => handleOpenEdit(sup)}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded-xs"
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDeleteRecords && (
                        <button
                          onClick={() => setDeleteModalSupplier(sup)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-xs"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayedSuppliers.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-xs">
            No suppliers found. Click "Register Supplier" to add authorized vendors.
          </div>
        )}
      </div>

      {/* Supplier Purchase History Modal */}
      {viewHistorySupplier && (
        <Modal
          isOpen={!!viewHistorySupplier}
          onClose={() => setViewHistorySupplier(null)}
          title={`Purchase History - ${viewHistorySupplier.name}`}
          subtitle={`Verified PO orders and delivery invoices`}
          maxWidth="3xl"
        >
          {(() => {
            const vendorPOs = purchases.filter(
              (p) => p.supplierId === viewHistorySupplier.id || p.supplierName === viewHistorySupplier.name
            );

            return (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex flex-wrap justify-between gap-3">
                  <div>
                    <span className="text-slate-500 block">Contact:</span>
                    <span className="font-semibold text-slate-900">
                      {viewHistorySupplier.contactPerson} ({viewHistorySupplier.phone})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Purchases:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(viewHistorySupplier.totalPurchases, settings.currencySymbol)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Payment Terms:</span>
                    <span className="font-medium text-slate-900">{viewHistorySupplier.paymentTerms}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">PO Number</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                        <th className="py-2.5 px-3 text-center">Delivery</th>
                        <th className="py-2.5 px-3 text-center">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorPOs.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.poNumber}</td>
                          <td className="py-2 px-3 text-slate-500">{p.date}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(p.grandTotal, settings.currencySymbol)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {p.deliveryStatus}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-200">
                              {p.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setViewHistorySupplier(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                  >
                    Close History
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Create / Edit Supplier Modal */}
      {isFormOpen && editingSupplier && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingSupplier.id ? 'Edit Supplier' : 'Register New Vendor / Supplier'}
          subtitle="Record vendor contact details, tax identification, and credit terms"
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Company / Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pak Lighting & Electrical Solutions"
                  value={editingSupplier.name || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Primary Contact Person *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engr. Salman Qureshi"
                  value={editingSupplier.contactPerson || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+92 21 34567890"
                  value={editingSupplier.phone || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="sales@vendor.com.pk"
                  value={editingSupplier.email || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category / Supply Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Kitchens, HVAC, Electrical, Tiles"
                  value={editingSupplier.category || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karachi, Lahore, Islamabad"
                  value={editingSupplier.city || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  NTN / STRN Tax Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4589214-7"
                  value={editingSupplier.ntnTaxNumber || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, ntnTaxNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Agreed Payment Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. Net 30 Days, 50% Advance, COD"
                  value={editingSupplier.paymentTerms || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Physical Office Address
                </label>
                <input
                  type="text"
                  placeholder="Plot #, Street, Commercial Area..."
                  value={editingSupplier.address || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes & Authorization Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Authorized dealerships, warranties, bank details..."
                  value={editingSupplier.notes || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
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
                {editingSupplier.id ? 'Save Changes' : 'Register Supplier'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteModalSupplier && (
        <DeleteConfirmModal
          isOpen={!!deleteModalSupplier}
          onClose={() => setDeleteModalSupplier(null)}
          onConfirm={async () => {
            await deleteSupplier(deleteModalSupplier.id);
          }}
          title="Delete Supplier"
          message={`Are you sure you want to remove '${deleteModalSupplier.name}' from the vendor directory?`}
          itemName={`${deleteModalSupplier.name} (${deleteModalSupplier.category})`}
        />
      )}
    </div>
  );
};
