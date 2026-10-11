import {
  User,
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
  SystemSettings
} from '../types';

export interface FullState {
  settings: SystemSettings;
  users: User[];
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
}

export const api = {
  // Fetch full state
  async getFullState(): Promise<FullState> {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Failed to load application state');
    return res.json();
  },

  // Reset to initial sample data
  async resetDemoData(): Promise<void> {
    const res = await fetch('/api/seed/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
  },

  // Generic Create
  async createItem<T>(collection: string, item: Partial<T>, currentUser?: { name: string; role: string }): Promise<T> {
    const res = await fetch(`/api/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, _currentUser: currentUser })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create ${collection} item`);
    }
    return res.json();
  },

  // Generic Update
  async updateItem<T>(collection: string, id: string, item: Partial<T>, currentUser?: { name: string; role: string }): Promise<T> {
    const res = await fetch(`/api/${collection}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, _currentUser: currentUser })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update ${collection} item`);
    }
    return res.json();
  },

  // Generic Delete
  async deleteItem(collection: string, id: string, currentUser?: { name: string; role: string }): Promise<void> {
    const query = new URLSearchParams({
      userName: currentUser?.name || 'Administrator',
      userRole: currentUser?.role || 'super_manager'
    });
    const res = await fetch(`/api/${collection}/${id}?${query.toString()}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to delete ${collection} item`);
    }
  },

  // Stock Transaction
  async recordStockTransaction(data: {
    inventoryItemId: string;
    transactionType: string;
    quantity: number;
    reason?: string;
    targetBranchId?: string;
    referenceNumber?: string;
    performedBy?: string;
  }): Promise<{ item: InventoryItem; transaction: StockTransaction }> {
    const res = await fetch('/api/inventory/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record stock transaction');
    }
    return res.json();
  },

  // Bulk Import
  async importBulk(collection: string, rows: any[], currentUser?: { name: string; role: string }): Promise<{ count: number; message: string }> {
    const res = await fetch(`/api/import/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, currentUser })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Bulk import failed');
    }
    return res.json();
  },

  // Save Settings
  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Handover Report
  async getHandoverReport(branchId: string): Promise<any> {
    const res = await fetch(`/api/reports/handover/${branchId}`);
    if (!res.ok) throw new Error('Failed to generate handover report');
    return res.json();
  }
};
