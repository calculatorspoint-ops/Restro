import {
  Branch,
  Project,
  LocationArea,
  ConstructionCost,
  Asset,
  InventoryItem,
  StockTransaction,
  PurchaseOrder,
  Supplier,
  Expense,
  DocumentAttachment,
  AuditLog,
  SystemSettings,
  User,
  Recipe
} from '../types';

export interface LocalERPSnapshot {
  version: number;
  timestamp: number;
  uid: string;
  branches: Branch[];
  projects: Project[];
  locations: LocationArea[];
  constructionCosts: ConstructionCost[];
  assets: Asset[];
  inventory: InventoryItem[];
  stockTransactions: StockTransaction[];
  purchases: PurchaseOrder[];
  suppliers: Supplier[];
  expenses: Expense[];
  documents: DocumentAttachment[];
  auditLogs: AuditLog[];
  users: User[];
  recipes: Recipe[];
  settings?: SystemSettings;
}

const STORAGE_PREFIX = 'resto_erp_cache_v2_';

export const persistentCache = {
  /**
   * Synchronously loads local cached snapshot for immediate zero-delay UI rendering.
   * Returns null if no valid cache exists or cache belongs to another user.
   */
  loadSnapshot(uid: string): LocalERPSnapshot | null {
    if (!uid || typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${uid}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LocalERPSnapshot;
      if (parsed && parsed.uid === uid && Array.isArray(parsed.branches)) {
        return parsed;
      }
      return null;
    } catch (e) {
      console.warn('Failed to load local ERP cache snapshot:', e);
      return null;
    }
  },

  /**
   * Persists the full snapshot locally to ensure permanent offline accessibility
   * and sub-second application launch on return visits.
   */
  saveSnapshot(uid: string, data: Omit<LocalERPSnapshot, 'version' | 'timestamp' | 'uid'>) {
    if (!uid || typeof window === 'undefined') return;
    try {
      const snapshot: LocalERPSnapshot = {
        version: 2,
        timestamp: Date.now(),
        uid,
        ...data
      };
      localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(snapshot));
    } catch (e) {
      // If quota exceeded, attempt to save without large historical logs
      console.warn('Local storage quota warning, saving compact snapshot:', e);
      try {
        const compact: LocalERPSnapshot = {
          version: 2,
          timestamp: Date.now(),
          uid,
          ...data,
          auditLogs: data.auditLogs.slice(0, 50),
          stockTransactions: data.stockTransactions.slice(0, 100)
        };
        localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(compact));
      } catch (err2) {
        console.error('Critical quota error saving local cache:', err2);
      }
    }
  },

  /**
   * Clears cached data for a specific user or all previous ERP sessions
   */
  clearSnapshot(uid?: string) {
    if (typeof window === 'undefined') return;
    try {
      if (uid) {
        localStorage.removeItem(`${STORAGE_PREFIX}${uid}`);
      } else {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(STORAGE_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      console.warn('Error clearing local ERP cache:', e);
    }
  }
};
