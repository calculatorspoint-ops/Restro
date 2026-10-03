import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Tag,
  ShieldAlert,
  Clock,
  MapPin,
  Building
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Asset, AssetCategory, AssetCondition, AssetStatus } from '../../types';
import { Modal } from '../common/Modal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excel';

interface AssetModuleViewProps {
  category?: AssetCategory | 'all';
  moduleTitle: string;
  moduleDescription: string;
  defaultSubcategory?: string;
  supportedSubcategories?: string[];
  showWattage?: boolean;
  showHvacFields?: boolean;
  showFurnitureFields?: boolean;
  showKitchenFields?: boolean;
  showItFields?: boolean;
}

export const AssetModuleView: React.FC<AssetModuleViewProps> = ({
  category = 'all',
  moduleTitle,
  moduleDescription,
  supportedSubcategories = [],
  showWattage = false,
  showHvacFields = false,
  showFurnitureFields = false,
  showKitchenFields = false,
  showItFields = false
}) => {
  const {
    branches,
    locations,
    suppliers,
    filteredAssets,
    saveAsset,
    deleteAsset,
    selectedBranchId,
    settings
  } = useData();
  const { canDeleteRecords } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Partial<Asset> | null>(null);
  const [deleteModalAsset, setDeleteModalAsset] = useState<Asset | null>(null);

  // Filter items
  const displayedAssets = useMemo(() => {
    return filteredAssets.filter((a) => {
      const matchesCategory =
        category === 'all'
          ? true
          : category === 'electrical'
          ? a.category === 'electrical' || a.category === 'lighting'
          : a.category === category;

      const branch = branches.find((b) => b.id === a.branchId);

      const matchesSearch =
        a.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubcat = selectedSubcategory === 'all' || a.subcategory === selectedSubcategory;
      const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;
      const matchesCondition = selectedCondition === 'all' || a.condition === selectedCondition;

      return matchesCategory && matchesSearch && matchesSubcat && matchesStatus && matchesCondition;
    });
  }, [
    filteredAssets,
    category,
    branches,
    searchTerm,
    selectedSubcategory,
    selectedStatus,
    selectedCondition
  ]);

  // Aggregate stats
  const totalAssetsCount = displayedAssets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0);
  const totalAssetsValue = displayedAssets.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);

  const handleOpenCreate = () => {
    const targetBranchId = selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '';
    const branchLocs = locations.filter((l) => l.branchId === targetBranchId);
    const initialLocation = branchLocs[0]?.name || 'Main Dining Hall';
    const initialLocationId = branchLocs[0]?.id || 'loc-01';

    const defaultCategory: AssetCategory =
      category === 'all' ? 'general' : category === 'electrical' ? 'lighting' : category;

    setEditingAsset({
      branchId: targetBranchId,
      locationId: initialLocationId,
      locationName: initialLocation,
      category: defaultCategory,
      subcategory: supportedSubcategories[0] || 'General Equipment',
      itemName: '',
      brand: '',
      model: '',
      specification: '',
      wattage: showWattage ? '18W' : '',
      voltage: showWattage ? '220V' : '',
      capacity: showHvacFields ? '24000 BTU' : '',
      tonnage: showHvacFields ? '2.0 Ton' : '',
      material: showFurnitureFields ? 'Solid Sheesham & Cast Iron' : '',
      size: showFurnitureFields ? '1200 x 800 mm' : '',
      color: showFurnitureFields ? 'Dark Walnut' : '',
      quantity: 1,
      unit: 'units',
      unitCost: 1000,
      totalCost: 1000,
      serialNumber: '',
      installationDate: new Date().toISOString().slice(0, 10),
      supplierName: suppliers[0]?.name || 'General Supplier',
      invoiceNumber: '',
      warranty: '1 Year',
      condition: 'Brand New',
      status: 'In Use',
      remarks: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset({ ...asset });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !editingAsset.branchId || !editingAsset.itemName) return;

    const qty = Number(editingAsset.quantity) || 1;
    const rate = Number(editingAsset.unitCost) || 0;
    const computedTotal = qty * rate;

    // Resolve location name
    const loc = locations.find((l) => l.id === editingAsset.locationId);
    const locName = loc ? loc.name : editingAsset.locationName || 'Main Area';

    await saveAsset({
      ...editingAsset,
      quantity: qty,
      unitCost: rate,
      totalCost: computedTotal,
      locationName: locName
    });

    setIsFormOpen(false);
    setEditingAsset(null);
  };

  const handleExport = () => {
    const exportData = displayedAssets.map((a) => {
      const branch = branches.find((b) => b.id === a.branchId);
      return {
        'Asset ID': a.id,
        'Branch Code': branch?.code || '',
        'Branch Name': branch?.name || '',
        'Category': a.category,
        'Subcategory': a.subcategory,
        'Item Name': a.itemName,
        'Brand': a.brand,
        'Model': a.model,
        'Specification': a.specification,
        'Location': a.locationName,
        'Quantity': a.quantity,
        'Unit': a.unit,
        'Unit Cost (PKR)': a.unitCost,
        'Total Cost (PKR)': a.totalCost,
        'Serial Number': a.serialNumber,
        'Installation Date': formatDate(a.installationDate),
        'Supplier': a.supplierName,
        'Warranty': a.warranty,
        'Condition': a.condition,
        'Status': a.status,
        'Remarks': a.remarks
      };
    });
    exportToExcel(exportData, `${moduleTitle.replace(/\s+/g, '_')}_Asset_Export`);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Total Installed Assets</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {totalAssetsCount} units
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{displayedAssets.length} asset entries</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Total Valuation</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(totalAssetsValue, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Capital equipment verified</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Operational Status</span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
            {displayedAssets.filter((a) => a.status === 'In Use').length} Active In Use
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {displayedAssets.filter((a) => a.status === 'Under Maintenance').length} under service
          </span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search item, brand, serial, area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden"
            />
          </div>

          {supportedSubcategories.length > 0 && (
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Subcategories</option>
              {supportedSubcategories.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="In Use">In Use</option>
            <option value="New">New</option>
            <option value="Available">Available</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Damaged">Damaged</option>
            <option value="Disposed">Disposed</option>
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
            <span>Add Asset Item</span>
          </button>
        </div>
      </div>

      {/* Assets Display: Desktop Table + Mobile Responsive Cards */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        {/* Desktop & Tablet Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Asset ID / Item</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Location / Area</th>
                <th className="py-3 px-4">Brand / Model</th>
                <th className="py-3 px-4">Key Specs</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
                <th className="py-3 px-4 text-right">Total Cost (PKR)</th>
                <th className="py-3 px-4 text-center">Condition</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedAssets.map((asset) => {
                const branch = branches.find((b) => b.id === asset.branchId);

                return (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{asset.itemName}</span>
                      <span className="text-[11px] font-mono text-slate-400 block">{asset.id}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{branch?.code}</span>
                      <span className="text-[11px] text-slate-400 block">{branch?.city}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {asset.locationName}
                      </span>
                      {asset.installationDate && (
                        <span className="text-[10px] text-slate-400 block ml-4">
                          Inst: {formatDate(asset.installationDate)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-800 block">{asset.brand || '-'}</span>
                      <span className="text-[11px] text-slate-500 font-mono block">{asset.model || ''}</span>
                    </td>
                    <td className="py-3 px-4 min-w-[180px]">
                      <span className="text-slate-700 block line-clamp-1">
                        {asset.wattage ? `${asset.wattage} · ` : ''}
                        {asset.tonnage ? `${asset.tonnage} · ` : ''}
                        {asset.specification || asset.subcategory}
                      </span>
                      {asset.warranty && (
                        <span className="text-[10px] text-slate-400 block">
                          Warranty: {asset.warranty}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                      {asset.quantity} {asset.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatCurrency(asset.unitCost, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(asset.totalCost, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-[11px] text-slate-700 font-medium">
                        {asset.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border ${
                          asset.status === 'In Use'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : asset.status === 'New'
                            ? 'text-sky-700 bg-sky-50 border-sky-200'
                            : asset.status === 'Under Maintenance'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(asset)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                          title="Edit Asset"
                          aria-label={`Edit ${asset.itemName}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteRecords && (
                          <button
                            onClick={() => setDeleteModalAsset(asset)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            title="Delete Asset"
                            aria-label={`Delete ${asset.itemName}`}
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
          {displayedAssets.map((asset) => {
            const branch = branches.find((b) => b.id === asset.branchId);

            return (
              <div
                key={asset.id}
                className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 space-y-2 text-xs"
              >
                {/* Header: Item name + ID badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{asset.itemName}</h4>
                    <span className="font-mono text-[10px] text-slate-400">{asset.id} · {asset.subcategory}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border shrink-0 ${
                      asset.status === 'In Use'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : asset.status === 'New'
                        ? 'text-sky-700 bg-sky-50 border-sky-200'
                        : asset.status === 'Under Maintenance'
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                {/* Details snippet */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-md border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Branch & Area</span>
                    <span className="font-semibold text-slate-800">{branch?.code || 'All'}</span> · {asset.locationName}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Brand / Specs</span>
                    <span className="text-slate-700 truncate block">
                      {asset.brand || 'Standard'} {asset.wattage ? `· ${asset.wattage}` : ''} {asset.tonnage ? `· ${asset.tonnage}` : ''}
                    </span>
                  </div>
                </div>

                {/* Financial figures strip */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Quantity & Rate</span>
                    <span className="font-semibold text-slate-700">{asset.quantity} {asset.unit} @ {formatCurrency(asset.unitCost, settings.currencySymbol)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-sans block">Total Cost</span>
                    <span className="font-bold text-slate-900 text-sm">{formatCurrency(asset.totalCost, settings.currencySymbol)}</span>
                  </div>
                </div>

                {/* Touch actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-500 font-medium">Condition: <strong>{asset.condition}</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(asset)}
                      className="min-h-[36px] px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1 active:bg-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {canDeleteRecords && (
                      <button
                        onClick={() => setDeleteModalAsset(asset)}
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

        {displayedAssets.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-xs">
            No assets found. Click "Add Asset Item" to record what has been installed in the branch.
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isFormOpen && editingAsset && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingAsset.id ? `Edit ${editingAsset.itemName}` : `Add New Asset (${moduleTitle})`}
          subtitle="Record installation location, technical specifications, and quantities"
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
                  value={editingAsset.branchId || ''}
                  onChange={(e) => {
                    const newBranchId = e.target.value;
                    const bLocs = locations.filter((l) => l.branchId === newBranchId);
                    setEditingAsset({
                      ...editingAsset,
                      branchId: newBranchId,
                      locationId: bLocs[0]?.id || '',
                      locationName: bLocs[0]?.name || ''
                    });
                  }}
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
                  Installation Location *
                </label>
                <select
                  required
                  value={editingAsset.locationId || ''}
                  onChange={(e) => {
                    const loc = locations.find((l) => l.id === e.target.value);
                    setEditingAsset({
                      ...editingAsset,
                      locationId: e.target.value,
                      locationName: loc ? loc.name : ''
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  {locations
                    .filter((l) => !editingAsset.branchId || l.branchId === editingAsset.branchId)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code})
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
                  placeholder="e.g. Downlights, Split AC, Range"
                  value={editingAsset.subcategory || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, subcategory: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Item / Asset Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 18W LED Downlight, 4 Ton Cassette AC, 4-Burner Range"
                  value={editingAsset.itemName || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, itemName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Philips, Gree, Falcon"
                  value={editingAsset.brand || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, brand: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Model / Reference Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. DN029B 18W, GUD140T"
                  value={editingAsset.model || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, model: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. SN-2026-98124"
                  value={editingAsset.serialNumber || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Installation Date
                </label>
                <input
                  type="date"
                  value={editingAsset.installationDate || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, installationDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              {/* Specific Field: Wattage / Voltage for Electrical */}
              {showWattage && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Wattage (W)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 18W, 24W, 5W"
                      value={editingAsset.wattage || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, wattage: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Voltage / Phase
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 220V, 400V 3-Phase"
                      value={editingAsset.voltage || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, voltage: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                    />
                  </div>
                </>
              )}

              {/* Specific Field: Tonnage / Capacity for HVAC */}
              {showHvacFields && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Capacity / BTU
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 48,000 BTU, 24,000 BTU"
                      value={editingAsset.capacity || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, capacity: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tonnage
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1.5 Ton, 2 Ton, 4 Ton"
                      value={editingAsset.tonnage || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, tonnage: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Next Maintenance Date
                    </label>
                    <input
                      type="date"
                      value={editingAsset.nextMaintenanceDate || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, nextMaintenanceDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                    />
                  </div>
                </>
              )}

              {/* Specific Field: Furniture details */}
              {showFurnitureFields && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Material
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Solid Sheesham & Cast Iron"
                      value={editingAsset.material || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, material: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Dimensions / Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1200 x 800 mm"
                      value={editingAsset.size || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, size: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Color / Polish
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dark Walnut, Emerald Velvet"
                      value={editingAsset.color || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, color: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                    />
                  </div>
                </>
              )}

              {/* Specific Field: IT & POS Details */}
              {showItFields && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      IP Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.10.20"
                      value={editingAsset.ipAddress || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, ipAddress: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Assigned User / Counter
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cashier 1, Manager Foyer"
                      value={editingAsset.assignedTo || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, assignedTo: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                    />
                  </div>
                </>
              )}

              {/* Quantity, Rate & Auto Calculation */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editingAsset.quantity ?? 1}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    const cost = Number(editingAsset.unitCost) || 0;
                    setEditingAsset({
                      ...editingAsset,
                      quantity: q,
                      totalCost: q * cost
                    });
                  }}
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
                  value={editingAsset.unitCost ?? 0}
                  onChange={(e) => {
                    const cost = Number(e.target.value);
                    const q = Number(editingAsset.quantity) || 1;
                    setEditingAsset({
                      ...editingAsset,
                      unitCost: cost,
                      totalCost: q * cost
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Calculated Total Cost (PKR)
                </label>
                <input
                  type="number"
                  readOnly
                  value={(editingAsset.quantity || 1) * (editingAsset.unitCost || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono font-bold bg-slate-50 text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Supplier / Vendor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pak Lighting, Karachi AC"
                  value={editingAsset.supplierName || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, supplierName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Warranty Term
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 Years, 5 Years Compressor"
                  value={editingAsset.warranty || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, warranty: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Condition *
                </label>
                <select
                  value={editingAsset.condition || 'Brand New'}
                  onChange={(e) => setEditingAsset({ ...editingAsset, condition: e.target.value as AssetCondition })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="Brand New">Brand New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Repair">Needs Repair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Asset Status *
                </label>
                <select
                  value={editingAsset.status || 'In Use'}
                  onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value as AssetStatus })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="In Use">In Use</option>
                  <option value="New">New</option>
                  <option value="Available">Available</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Disposed">Disposed</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Technical Specifications & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Dimensions, voltage, amperage, installation notes..."
                  value={editingAsset.specification || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, specification: e.target.value })}
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
                {editingAsset.id ? 'Save Asset' : 'Record Asset'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteModalAsset && (
        <DeleteConfirmModal
          isOpen={!!deleteModalAsset}
          onClose={() => setDeleteModalAsset(null)}
          onConfirm={async () => {
            await deleteAsset(deleteModalAsset.id);
          }}
          title="Delete Asset Item"
          message={`Are you sure you want to remove '${deleteModalAsset.itemName}' from the asset registry?`}
          itemName={`${deleteModalAsset.id} - ${deleteModalAsset.itemName} (${deleteModalAsset.quantity} ${deleteModalAsset.unit})`}
        />
      )}
    </div>
  );
};
