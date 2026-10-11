import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear errors whenever modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsDeleting(false);
    }
  }, [isOpen, itemName]);

  const isBusy = loading || isDeleting;

  const handleConfirm = async () => {
    if (isBusy) return;
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Delete operation error:', err);
      const rawMsg = err?.message || String(err || '');
      if (
        rawMsg.includes('Missing or insufficient permissions') ||
        rawMsg.includes('permission-denied')
      ) {
        setErrorMessage(
          'Permission Denied: Your account role does not have permission to delete this record.'
        );
      } else {
        setErrorMessage(
          rawMsg && rawMsg.length < 160 ? rawMsg : 'Failed to delete record from database. Please try again.'
        );
      }
      // Modal remains open on error so user can retry or cancel
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!isBusy) onClose(); }} title={title} maxWidth="md">
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
            {itemName && (
              <p className="mt-2 text-xs font-mono bg-slate-100 p-2 rounded-md text-slate-800 break-all border border-slate-200">
                {itemName}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isBusy ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
