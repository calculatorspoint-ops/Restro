import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Search,
  DollarSign,
  PackageSearch,
  Building,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { LocationArea } from '../types';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { formatCurrency, formatNumber } from '../utils/formatters';

export const LocationRecordsPage: React.FC = () => {
  const {
    branches,
    locations,
    filteredLocations,
    filteredAssets,
    saveLocation,
    deleteLocation,
    selectedBranchId,
    settings
  } = useData();
  const { canDeleteRecords, canManageBranches, isSuperManager } = useAuth();

  const [activeLocationId, setActiveLocationId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Partial<LocationArea> | null>(null);
  const [deleteModalLocation, setDeleteModalLocation] = useState<LocationArea | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Default active location
  const activeLocation = useMemo(() => {
    if (activeLocationId) {
      const found = filteredLocations.find((l) => l.id === activeLocationId);
      if (found) return found;
    }
    return filteredLocations[0];
  }, [filteredLocations, activeLocationId]);

  // Assets inside active location
  const locationAssets = useMemo(() => {
    if (!activeLocation) return [];
    return filteredAssets.filter(
      (a) => a.locationId === activeLocation.id || a.locationName === activeLocation.name
    );
  }, [filteredAssets, activeLocation]);

  const locationTotalValue = locationAssets.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
  const locationTotalItemsCount = locationAssets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0);

  const handleOpenCreate = () => {
    const targetBranchId = selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '';
    setEditingLocation({
      branchId: targetBranchId,
      name: '',
      code: `LOC-0${filteredLocations.length + 1}`,
      description: ''
    });
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (loc: LocationArea, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingLocation({ ...loc });
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingLocation(null);
    setSubmitError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !editingLocation.name || !editingLocation.branchId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const saved = await saveLocation(editingLocation);
      setActiveLocationId(saved.id);
      // Dialog automatically closes ONLY after Firestore mutation succeeds
      setIsFormOpen(false);
      setEditingLocation(null);
    } catch (err: any) {
      console.error('Failed to save location:', err);
      const rawMsg = err?.message || String(err || '');
      if (
        rawMsg.includes('Missing or insufficient permissions') ||
        rawMsg.includes('permission-denied')
      ) {
        setSubmitError(
          'Permission Denied: Your account role is not authorized to edit physical locations.'
        );
      } else {
        setSubmitError(
          rawMsg && rawMsg.length < 160 ? rawMsg : 'Failed to save location. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Physical Room & Zone Breakdown
          </h2>
          <p className="text-xs text-slate-500">
            Explore equipment and assets installed in each room, zone, and kitchen section
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Location</span>
        </button>
      </div>

      {/* 2 Column Layout: Location Navigator on Left, Assets Installed on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Location List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Configured Locations ({filteredLocations.length})
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredLocations.map((loc) => {
              const isSelected = activeLocation?.id === loc.id;
              const locAssets = filteredAssets.filter(
                (a) => a.locationId === loc.id || a.locationName === loc.name
              );
              const totalVal = locAssets.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
              const branch = branches.find((b) => b.id === loc.branchId);

              return (
                <div
                  key={loc.id}
                  onClick={() => setActiveLocationId(loc.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold flex items-center gap-1.5 truncate">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="truncate">{loc.name}</span>
                    </span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded-xs ${
                        isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {loc.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-2">
                    <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                      {locAssets.length} asset entries
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isSelected ? 'text-emerald-400' : 'text-slate-900'
                      }`}
                    >
                      {formatCurrency(totalVal, settings.currencySymbol)}
                    </span>
                  </div>

                  {branch && selectedBranchId === 'all' && (
                    <div
                      className={`text-[10px] mt-1 pt-1 border-t truncate ${
                        isSelected ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      Branch: {branch.name}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredLocations.length === 0 && (
              <div className="p-8 bg-white border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                No locations defined for this branch yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Location Detail & Installed Asset Matrix (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeLocation ? (
            <>
              {/* Location Banner Card */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {activeLocation.name}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-sm">
                      {activeLocation.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(activeLocation)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ml-1"
                      title="Edit Room / Location"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {canDeleteRecords && (
                      <button
                        type="button"
                        onClick={() => setDeleteModalLocation(activeLocation)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {activeLocation.description && (
                    <p className="text-xs text-slate-500">{activeLocation.description}</p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-slate-500 block">Total Installed Value</span>
                  <span className="text-xl font-bold font-mono text-slate-900 block mt-0.5">
                    {formatCurrency(locationTotalValue, settings.currencySymbol)}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium block">
                    {locationTotalItemsCount} total physical items
                  </span>
                </div>
              </div>

              {/* Installed Assets List */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Equipment & Assets Installed in {activeLocation.name}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {locationAssets.length} lines
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {locationAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {asset.itemName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 bg-slate-100 rounded-xs">
                            {asset.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                          {asset.brand && <span>Brand: {asset.brand}</span>}
                          {asset.wattage && <span>· {asset.wattage}</span>}
                          {asset.tonnage && <span>· {asset.tonnage}</span>}
                          {asset.model && <span>· Model: {asset.model}</span>}
                          {asset.serialNumber && (
                            <span className="font-mono text-slate-400">
                              (S/N: {asset.serialNumber})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-slate-900">
                          {asset.quantity} {asset.unit} × {formatCurrency(asset.unitCost, settings.currencySymbol)}
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                          = {formatCurrency(asset.totalCost, settings.currencySymbol)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {locationAssets.length === 0 && (
                    <div className="p-12 text-center text-xs text-slate-500">
                      No assets currently assigned to this location. Use the Electrical, HVAC, Furniture, or Kitchen modules to assign equipment here.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
              Select a location on the left to inspect its installed inventory.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Location Modal */}
      {isFormOpen && editingLocation && (
        <Modal
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          title={editingLocation.id ? 'Edit Location' : 'Add Physical Room / Location'}
          subtitle="Configure dining rooms, kitchens, bars, offices, or washrooms"
          maxWidth="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{submitError}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Branch *
              </label>
              <select
                required
                value={editingLocation.branchId || ''}
                onChange={(e) => setEditingLocation({ ...editingLocation, branchId: e.target.value })}
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
                Location / Room Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dining Hall, Hot Kitchen, Rooftop Terrace"
                value={editingLocation.name || ''}
                onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Short Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MDH, CHK, ROOF"
                value={editingLocation.code || ''}
                onChange={(e) => setEditingLocation({ ...editingLocation, code: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                placeholder="Capacity notes, floor level, purpose..."
                value={editingLocation.description || ''}
                onChange={(e) => setEditingLocation({ ...editingLocation, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden"
              />
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
                    : editingLocation.id
                    ? 'Save Location'
                    : 'Create Location'}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalLocation && (
        <DeleteConfirmModal
          isOpen={!!deleteModalLocation}
          onClose={() => setDeleteModalLocation(null)}
          onConfirm={async () => {
            await deleteLocation(deleteModalLocation.id);
            if (activeLocationId === deleteModalLocation.id) {
              setActiveLocationId('');
            }
          }}
          title="Delete Physical Location"
          message={`Are you sure you want to remove '${deleteModalLocation.name}'? Equipment linked to this area will still exist in the asset database.`}
          itemName={`${deleteModalLocation.code} - ${deleteModalLocation.name}`}
        />
      )}
    </div>
  );
};
