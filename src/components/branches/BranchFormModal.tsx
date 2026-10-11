import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Branch, BranchStatus } from '../../types';
import { Modal } from '../common/Modal';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Partial<Branch> | null;
  onSave: (branchData: Partial<Branch>) => Promise<void>;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  branch,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Branch>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize isolated local form state whenever the modal opens or branch reference changes
  useEffect(() => {
    if (isOpen && branch) {
      setFormData({
        id: branch.id,
        code: branch.code || '',
        name: branch.name || '',
        address: branch.address || '',
        city: branch.city || 'Karachi',
        province: branch.province || 'Sindh',
        contactNumber: branch.contactNumber || '',
        branchManager: branch.branchManager || '',
        openingDate: branch.openingDate || new Date().toISOString().slice(0, 10),
        status: branch.status || 'Setup in Progress',
        notes: branch.notes || '',
        userId: branch.userId,
        createdAt: branch.createdAt
      });
      setValidationErrors({});
      setSubmitError(null);
    }
  }, [isOpen, branch?.id]);

  // Robust, controlled input updater (prevents stale closure overwrites and drops)
  const handleInputChange = (field: keyof Branch, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!formData.code?.trim()) {
      errors.code = 'Branch Code is required (e.g. KHI-04).';
    }
    if (!formData.name?.trim()) {
      errors.name = 'Branch Name is required.';
    }
    if (!formData.city?.trim()) {
      errors.city = 'City is required.';
    }
    if (!formData.province?.trim()) {
      errors.province = 'Province/Territory is required.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      console.error('Branch form submission error:', err);
      const rawMsg = err?.message || String(err);
      if (
        rawMsg.includes('Missing or insufficient permissions') ||
        rawMsg.includes('permission-denied')
      ) {
        setSubmitError(
          'Unable to save this branch. You may not have permission to perform this action. Please check your account permissions or contact your administrator.'
        );
      } else {
        setSubmitError(rawMsg.length < 150 ? rawMsg : 'Unable to save branch to database.');
      }
      // Form remains open so typed data is not lost
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !branch) return null;

  const isEditing = Boolean(formData.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Restaurant Branch' : 'Add New Restaurant Branch'}
      subtitle="Configure location, operational status, timeline, and branch manager"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Save Failed</span>
              <p className="mt-0.5 text-rose-700 leading-relaxed">{submitError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Branch Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. KHI-04"
              value={formData.code || ''}
              onChange={(e) => handleInputChange('code', e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-md font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${
                validationErrors.code ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {validationErrors.code && (
              <span className="text-[11px] text-rose-600 mt-1 block">{validationErrors.code}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DHA Phase 6 Express"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${
                validationErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {validationErrors.name && (
              <span className="text-[11px] text-rose-600 mt-1 block">{validationErrors.name}</span>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Street Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Commercial Plot 12-C, Main Boulevard, DHA Phase 6"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
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
              value={formData.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${
                validationErrors.city ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {validationErrors.city && (
              <span className="text-[11px] text-rose-600 mt-1 block">{validationErrors.city}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Province / Territory *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sindh, Punjab, ICT, KPK"
              value={formData.province || ''}
              onChange={(e) => handleInputChange('province', e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${
                validationErrors.province ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {validationErrors.province && (
              <span className="text-[11px] text-rose-600 mt-1 block">{validationErrors.province}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Contact Phone Number
            </label>
            <input
              type="text"
              placeholder="+92 21 35876543"
              value={formData.contactNumber || ''}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Branch / Project Manager
            </label>
            <input
              type="text"
              placeholder="e.g. Tariq Mehmood"
              value={formData.branchManager || ''}
              onChange={(e) => handleInputChange('branchManager', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Opening / Launch Date
            </label>
            <input
              type="date"
              value={formData.openingDate || ''}
              onChange={(e) => handleInputChange('openingDate', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Status *
            </label>
            <select
              value={formData.status || 'Setup in Progress'}
              onChange={(e) => handleInputChange('status', e.target.value as BranchStatus)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="Planning">Planning</option>
              <option value="Under Construction">Under Construction</option>
              <option value="Setup in Progress">Setup in Progress</option>
              <option value="Operational">Operational</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Branch Notes & Architectural Scope
            </label>
            <textarea
              rows={3}
              placeholder="Seating capacity, layout notes, kitchen size, lease terms..."
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {isSubmitting
                ? 'Saving Branch...'
                : isEditing
                ? 'Save Changes'
                : 'Create Branch'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
