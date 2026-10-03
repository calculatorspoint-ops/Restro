import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import { api, FullState } from '../services/api';
import { firestoreService } from '../services/firestoreService';
import { INITIAL_RECIPES } from '../services/initialData';
import { useAuth } from './AuthContext';

interface BranchCostBreakdown {
  branchId: string;
  construction: number;
  electrical: number;
  lighting: number;
  hvac: number;
  furniture: number;
  kitchen: number;
  it_pos: number;
  general: number;
  assetTotal: number;
  expenses: number;
  totalActual: number;
  estimatedBudget: number;
  remainingBudget: number;
  isOverBudget: boolean;
}

export interface SystemAlert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  module: string;
  branchName?: string;
  date?: string;
}

interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface DataContextType {
  loading: boolean;
  error: string | null;
  notification: NotificationToast | null;
  clearNotification: () => void;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  activeBranch: Branch | undefined;
  
  // Data collections
  settings: SystemSettings;
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

  // Filtered views by selected branch
  filteredProjects: Project[];
  filteredLocations: LocationArea[];
  filteredConstructionCosts: ConstructionCost[];
  filteredAssets: Asset[];
  filteredInventory: InventoryItem[];
  filteredPurchases: PurchaseOrder[];
  filteredExpenses: Expense[];
  filteredDocuments: DocumentAttachment[];

  // Rollups & Alerts
  getBranchCostBreakdown: (branchId: string) => BranchCostBreakdown;
  alerts: SystemAlert[];

  // Actions
  reloadState: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  
  // CRUD
  saveBranch: (branch: Partial<Branch>) => Promise<Branch>;
  deleteBranch: (id: string) => Promise<void>;
  
  saveProject: (project: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;

  saveLocation: (location: Partial<LocationArea>) => Promise<LocationArea>;
  deleteLocation: (id: string) => Promise<void>;

  saveConstructionCost: (cost: Partial<ConstructionCost>) => Promise<ConstructionCost>;
  deleteConstructionCost: (id: string) => Promise<void>;

  saveAsset: (asset: Partial<Asset>) => Promise<Asset>;
  deleteAsset: (id: string) => Promise<void>;

  saveInventoryItem: (item: Partial<InventoryItem>) => Promise<InventoryItem>;
  deleteInventoryItem: (id: string) => Promise<void>;
  recordStockTransaction: (params: {
    inventoryItemId: string;
    transactionType: string;
    quantity: number;
    reason?: string;
    targetBranchId?: string;
    referenceNumber?: string;
  }) => Promise<void>;

  savePurchaseOrder: (po: Partial<PurchaseOrder>) => Promise<PurchaseOrder>;
  deletePurchaseOrder: (id: string) => Promise<void>;

  saveSupplier: (supplier: Partial<Supplier>) => Promise<Supplier>;
  deleteSupplier: (id: string) => Promise<void>;

  saveExpense: (expense: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;

  saveDocument: (doc: Partial<DocumentAttachment>) => Promise<DocumentAttachment>;
  deleteDocument: (id: string) => Promise<void>;

  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  saveUser: (user: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  saveRecipe: (recipe: Partial<Recipe>) => Promise<Recipe>;
  deleteRecipe: (id: string) => Promise<void>;
  bulkImport: (collection: string, rows: any[]) => Promise<number>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationToast | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ id: String(Date.now()), type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const clearNotification = () => setNotification(null);

  const [settings, setSettings] = useState<SystemSettings>({
    companyName: "Royal Spice Hospitality Group",
    companyTagline: "Premium Multi-Branch Restaurant & Cafe Operations",
    currency: "PKR",
    currencySymbol: "Rs.",
    taxRate: 16,
    dateFormat: "DD-MM-YYYY",
    lowStockThreshold: 10,
    warrantyAlertDays: 60,
    maintenanceAlertDays: 14
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [locations, setLocations] = useState<LocationArea[]>([]);
  const [constructionCosts, setConstructionCosts] = useState<ConstructionCost[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);

  const applyFullState = (state: FullState) => {
    if (state.settings) setSettings(state.settings);
    if (state.branches) setBranches(state.branches);
    if (state.projects) setProjects(state.projects);
    if (state.locations) setLocations(state.locations);
    if (state.constructionCosts) setConstructionCosts(state.constructionCosts);
    if (state.assets) setAssets(state.assets);
    if (state.inventory) setInventory(state.inventory);
    if (state.stockTransactions) setStockTransactions(state.stockTransactions);
    if (state.purchases) setPurchases(state.purchases);
    if (state.suppliers) setSuppliers(state.suppliers);
    if (state.expenses) setExpenses(state.expenses);
    if (state.documents) setDocuments(state.documents);
    if (state.auditLogs) setAuditLogs(state.auditLogs);
    if (state.users) setUsers(state.users);
  };

  const reloadState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Firestore collections can be loaded
      try {
        await firestoreService.seedInitialDataIfEmpty();
        const [
          fbBranches,
          fbProjects,
          fbAssets,
          fbConstruction,
          fbInventory,
          fbPurchases,
          fbSuppliers,
          fbExpenses,
          fbLocations,
          fbRecipes
        ] = await Promise.all([
          firestoreService.getCollection<Branch>('branches'),
          firestoreService.getCollection<Project>('projects'),
          firestoreService.getCollection<Asset>('assets'),
          firestoreService.getCollection<ConstructionCost>('constructionCosts'),
          firestoreService.getCollection<InventoryItem>('inventory'),
          firestoreService.getCollection<PurchaseOrder>('purchases'),
          firestoreService.getCollection<Supplier>('suppliers'),
          firestoreService.getCollection<Expense>('expenses'),
          firestoreService.getCollection<LocationArea>('locations'),
          firestoreService.getCollection<Recipe>('recipes')
        ]);

        if (fbBranches && fbBranches.length > 0) {
          setBranches(fbBranches);
          setProjects(fbProjects || []);
          setAssets(fbAssets || []);
          setConstructionCosts(fbConstruction || []);
          setInventory(fbInventory || []);
          setPurchases(fbPurchases || []);
          setSuppliers(fbSuppliers || []);
          setExpenses(fbExpenses || []);
          setLocations(fbLocations || []);
          if (fbRecipes && fbRecipes.length > 0) {
            setRecipes(fbRecipes);
          }
          setLoading(false);
          return;
        }
      } catch (fbErr) {
        console.warn('Firestore direct fetch fallback to local API:', fbErr);
      }

      // API Fallback
      try {
        const data = await api.getFullState();
        applyFullState(data);
      } catch (apiErr) {
        console.warn("API fallback failed, using in-memory state:", apiErr);
      }
    } catch (err: any) {
      console.error('Failed to load ERP state:', err);
      setError(err.message || 'Unable to connect to database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadState();
  }, [reloadState]);

  const resetDemoData = async () => {
    try {
      setLoading(true);
      await firestoreService.resetDemoDataInFirestore();
      await api.resetDemoData();
      await reloadState();
      showNotification('Successfully restored default multi-branch demo data to Cloud Firestore.');
    } catch (err) {
      console.error('Reset error:', err);
      showNotification('Reset completed with local state.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const activeBranch = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Filtered collections
  const filteredProjects = useMemo(() => {
    if (selectedBranchId === 'all') return projects;
    return projects.filter((p) => p.branchId === selectedBranchId);
  }, [projects, selectedBranchId]);

  const filteredLocations = useMemo(() => {
    if (selectedBranchId === 'all') return locations;
    return locations.filter((l) => l.branchId === selectedBranchId);
  }, [locations, selectedBranchId]);

  const filteredConstructionCosts = useMemo(() => {
    if (selectedBranchId === 'all') return constructionCosts;
    return constructionCosts.filter((c) => c.branchId === selectedBranchId);
  }, [constructionCosts, selectedBranchId]);

  const filteredAssets = useMemo(() => {
    if (selectedBranchId === 'all') return assets;
    return assets.filter((a) => a.branchId === selectedBranchId);
  }, [assets, selectedBranchId]);

  const filteredInventory = useMemo(() => {
    if (selectedBranchId === 'all') return inventory;
    return inventory.filter((i) => i.branchId === selectedBranchId);
  }, [inventory, selectedBranchId]);

  const filteredPurchases = useMemo(() => {
    if (selectedBranchId === 'all') return purchases;
    return purchases.filter((p) => p.branchId === selectedBranchId);
  }, [purchases, selectedBranchId]);

  const filteredExpenses = useMemo(() => {
    if (selectedBranchId === 'all') return expenses;
    return expenses.filter((e) => e.branchId === selectedBranchId);
  }, [expenses, selectedBranchId]);

  const filteredDocuments = useMemo(() => {
    if (selectedBranchId === 'all') return documents;
    return documents.filter((d) => d.branchId === selectedBranchId);
  }, [documents, selectedBranchId]);

  // Cost breakdown
  const getBranchCostBreakdown = useCallback((branchId: string): BranchCostBreakdown => {
    const branchConstruction = constructionCosts
      .filter((c) => c.branchId === branchId)
      .reduce((sum, c) => sum + (Number(c.totalCost) || 0), 0);

    const branchAssets = assets.filter((a) => a.branchId === branchId);
    const sumCat = (cat: string) =>
      branchAssets.filter((a) => a.category === cat).reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);

    const electrical = sumCat('electrical');
    const lighting = sumCat('lighting');
    const hvac = sumCat('hvac');
    const furniture = sumCat('furniture');
    const kitchen = sumCat('kitchen');
    const it_pos = sumCat('it_pos');
    const general = sumCat('general');
    const assetTotal = branchAssets.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);

    const branchExpenses = expenses
      .filter((e) => e.branchId === branchId)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalActual = branchConstruction + assetTotal + branchExpenses;

    const project = projects.find((p) => p.branchId === branchId);
    const estimatedBudget = project ? Number(project.estimatedBudget) || 0 : 0;
    const remainingBudget = estimatedBudget - totalActual;

    return {
      branchId,
      construction: branchConstruction,
      electrical,
      lighting,
      hvac,
      furniture,
      kitchen,
      it_pos,
      general,
      assetTotal,
      expenses: branchExpenses,
      totalActual,
      estimatedBudget,
      remainingBudget,
      isOverBudget: remainingBudget < 0 && estimatedBudget > 0
    };
  }, [constructionCosts, assets, expenses, projects]);

  // System Alerts Engine
  const alerts = useMemo(() => {
    const list: SystemAlert[] = [];
    const today = new Date();

    // Low stock
    inventory.forEach((item) => {
      if (item.currentStock <= item.minimumLevel) {
        const branch = branches.find((b) => b.id === item.branchId);
        list.push({
          id: `alert-stock-${item.id}`,
          type: item.currentStock === 0 ? 'danger' : 'warning',
          title: 'Low Stock Alert',
          message: `${item.itemName} stock is ${item.currentStock} ${item.unit} (Min: ${item.minimumLevel} ${item.unit}). Reorder recommended.`,
          module: 'Inventory',
          branchName: branch?.name
        });
      }
    });

    // Budget overruns
    projects.forEach((proj) => {
      const breakdown = getBranchCostBreakdown(proj.branchId);
      if (breakdown.isOverBudget) {
        const branch = branches.find((b) => b.id === proj.branchId);
        list.push({
          id: `alert-budget-${proj.id}`,
          type: 'danger',
          title: 'Project Over Budget',
          message: `${proj.projectName} is over budget by ${settings.currencySymbol} ${Math.abs(breakdown.remainingBudget).toLocaleString('en-PK')}.`,
          module: 'Projects',
          branchName: branch?.name
        });
      }
    });

    // Maintenance due
    assets.forEach((asset) => {
      if (asset.nextMaintenanceDate) {
        const maintDate = new Date(asset.nextMaintenanceDate);
        const diffDays = Math.ceil((maintDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= settings.maintenanceAlertDays && diffDays >= -30) {
          const branch = branches.find((b) => b.id === asset.branchId);
          list.push({
            id: `alert-maint-${asset.id}`,
            type: diffDays < 0 ? 'danger' : 'warning',
            title: diffDays < 0 ? 'Maintenance Overdue' : 'Maintenance Due Soon',
            message: `${asset.itemName} (${asset.model || asset.category}) maintenance ${diffDays < 0 ? 'was due' : 'is due'} in ${Math.abs(diffDays)} days (${asset.nextMaintenanceDate}).`,
            module: 'Maintenance',
            branchName: branch?.name,
            date: asset.nextMaintenanceDate
          });
        }
      }
    });

    return list;
  }, [inventory, projects, assets, branches, getBranchCostBreakdown, settings]);

  const auditUser = {
    name: currentUser?.name || 'Administrator',
    role: currentUser?.role || 'super_admin'
  };

  // Branch CRUD
  const saveBranch = async (branchData: Partial<Branch>) => {
    let saved: Branch;
    try {
      if (branchData.id && branches.some((b) => b.id === branchData.id)) {
        saved = await firestoreService.saveDocument('branches', branchData as Branch);
      } else {
        const newBranch = {
          ...branchData,
          id: branchData.id || `br-${Date.now()}`,
          createdAt: new Date().toISOString()
        } as Branch;
        saved = await firestoreService.saveDocument('branches', newBranch);
      }
      setBranches((prev) => {
        const exists = prev.some((b) => b.id === saved.id);
        return exists ? prev.map((b) => (b.id === saved.id ? saved : b)) : [...prev, saved];
      });
      showNotification(`Branch '${saved.name}' saved to Cloud Firestore.`);
    } catch {
      try {
        if (branchData.id && branches.some((b) => b.id === branchData.id)) {
          saved = await api.updateItem<Branch>('branches', branchData.id, branchData, auditUser);
          setBranches((prev) => prev.map((b) => (b.id === saved.id ? saved : b)));
        } else {
          saved = await api.createItem<Branch>('branches', branchData, auditUser);
          setBranches((prev) => [...prev, saved]);
        }
        showNotification(`Branch '${saved.name}' saved.`);
      } catch {
        // Local state fallback
        saved = { ...branchData, id: branchData.id || `br-${Date.now()}`, createdAt: branchData.createdAt || new Date().toISOString() } as Branch;
        setBranches((prev) => { const e = prev.some((b) => b.id === saved.id); return e ? prev.map((b) => b.id === saved.id ? saved : b) : [...prev, saved]; });
        showNotification(`Branch '${saved.name}' saved.`);
      }
    }
    return saved;
  };

  const deleteBranch = async (id: string) => {
    try { await firestoreService.deleteDocument('branches', id); } catch { /* ignore */ }
    try { await api.deleteItem('branches', id, auditUser); } catch { /* ignore */ }
    setBranches((prev) => prev.filter((b) => b.id !== id));
    if (selectedBranchId === id) setSelectedBranchId('all');
    showNotification('Branch deleted successfully.');
  };

  // Project CRUD
  const saveProject = async (projectData: Partial<Project>) => {
    let saved: Project;
    try {
      const target = {
        ...projectData,
        id: projectData.id || `proj-${Date.now()}`
      } as Project;
      saved = await firestoreService.saveDocument('projects', target);
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved];
      });
      showNotification(`Setup project '${saved.projectName}' saved.`);
    } catch {
      try {
        if (projectData.id && projects.some((p) => p.id === projectData.id)) {
          saved = await api.updateItem<Project>('projects', projectData.id, projectData, auditUser);
          setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        } else {
          saved = await api.createItem<Project>('projects', projectData, auditUser);
          setProjects((prev) => [...prev, saved]);
        }
        showNotification(`Setup project '${saved.projectName}' saved.`);
      } catch {
        saved = { ...projectData, id: projectData.id || `proj-${Date.now()}` } as Project;
        setProjects((prev) => { const e = prev.some((p) => p.id === saved.id); return e ? prev.map((p) => p.id === saved.id ? saved : p) : [...prev, saved]; });
        showNotification(`Setup project '${saved.projectName}' saved.`);
      }
    }
    return saved;
  };

  const deleteProject = async (id: string) => {
    try { await firestoreService.deleteDocument('projects', id); } catch { /* ignore */ }
    try { await api.deleteItem('projects', id, auditUser); } catch { /* ignore */ }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showNotification('Project removed.');
  };

  // Location CRUD
  const saveLocation = async (locData: Partial<LocationArea>) => {
    let saved: LocationArea;
    try {
      const target = {
        ...locData,
        id: locData.id || `loc-${Date.now()}`
      } as LocationArea;
      saved = await firestoreService.saveDocument('locations', target);
      setLocations((prev) => {
        const exists = prev.some((l) => l.id === saved.id);
        return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [...prev, saved];
      });
      showNotification(`Location '${saved.name}' saved.`);
    } catch {
      try {
        if (locData.id && locations.some((l) => l.id === locData.id)) {
          saved = await api.updateItem<LocationArea>('locations', locData.id, locData, auditUser);
          setLocations((prev) => prev.map((l) => (l.id === saved.id ? saved : l)));
        } else {
          saved = await api.createItem<LocationArea>('locations', locData, auditUser);
          setLocations((prev) => [...prev, saved]);
        }
        showNotification(`Location '${saved.name}' saved.`);
      } catch {
        saved = { ...locData, id: locData.id || `loc-${Date.now()}` } as LocationArea;
        setLocations((prev) => { const e = prev.some((l) => l.id === saved.id); return e ? prev.map((l) => l.id === saved.id ? saved : l) : [...prev, saved]; });
        showNotification(`Location '${saved.name}' saved.`);
      }
    }
    return saved;
  };

  const deleteLocation = async (id: string) => {
    try { await firestoreService.deleteDocument('locations', id); } catch { /* ignore */ }
    try { await api.deleteItem('locations', id, auditUser); } catch { /* ignore */ }
    setLocations((prev) => prev.filter((l) => l.id !== id));
    showNotification('Location removed.');
  };

  // Construction Cost CRUD
  const saveConstructionCost = async (costData: Partial<ConstructionCost>) => {
    let saved: ConstructionCost;
    try {
      const target = {
        ...costData,
        id: costData.id || `cc-${Date.now()}`
      } as ConstructionCost;
      saved = await firestoreService.saveDocument('constructionCosts', target);
      setConstructionCosts((prev) => {
        const exists = prev.some((c) => c.id === saved.id);
        return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved];
      });
      showNotification(`Construction item '${saved.description}' saved.`);
    } catch {
      try {
        if (costData.id && constructionCosts.some((c) => c.id === costData.id)) {
          saved = await api.updateItem<ConstructionCost>('constructionCosts', costData.id, costData, auditUser);
          setConstructionCosts((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
        } else {
          saved = await api.createItem<ConstructionCost>('constructionCosts', costData, auditUser);
          setConstructionCosts((prev) => [...prev, saved]);
        }
        showNotification(`Construction item '${saved.description}' saved.`);
      } catch {
        saved = { ...costData, id: costData.id || `cc-${Date.now()}` } as ConstructionCost;
        setConstructionCosts((prev) => { const e = prev.some((c) => c.id === saved.id); return e ? prev.map((c) => c.id === saved.id ? saved : c) : [...prev, saved]; });
        showNotification(`Construction item '${saved.description}' saved.`);
      }
    }
    return saved;
  };

  const deleteConstructionCost = async (id: string) => {
    try { await firestoreService.deleteDocument('constructionCosts', id); } catch { /* ignore */ }
    try { await api.deleteItem('constructionCosts', id, auditUser); } catch { /* ignore */ }
    setConstructionCosts((prev) => prev.filter((c) => c.id !== id));
    showNotification('Construction cost record deleted.');
  };

  // Asset CRUD
  const saveAsset = async (assetData: Partial<Asset>) => {
    let saved: Asset;
    try {
      const target = {
        ...assetData,
        id: assetData.id || `ast-${Date.now()}`
      } as Asset;
      saved = await firestoreService.saveDocument('assets', target);
      setAssets((prev) => {
        const exists = prev.some((a) => a.id === saved.id);
        return exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [...prev, saved];
      });
      showNotification(`Asset '${saved.itemName}' updated in Cloud Firestore.`);
    } catch {
      try {
        if (assetData.id && assets.some((a) => a.id === assetData.id)) {
          saved = await api.updateItem<Asset>('assets', assetData.id, assetData, auditUser);
          setAssets((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
        } else {
          saved = await api.createItem<Asset>('assets', assetData, auditUser);
          setAssets((prev) => [...prev, saved]);
        }
        showNotification(`Asset '${saved.itemName}' saved.`);
      } catch {
        saved = { ...assetData, id: assetData.id || `ast-${Date.now()}` } as Asset;
        setAssets((prev) => { const e = prev.some((a) => a.id === saved.id); return e ? prev.map((a) => a.id === saved.id ? saved : a) : [...prev, saved]; });
        showNotification(`Asset '${saved.itemName}' saved.`);
      }
    }
    return saved;
  };

  const deleteAsset = async (id: string) => {
    try { await firestoreService.deleteDocument('assets', id); } catch { /* ignore */ }
    try { await api.deleteItem('assets', id, auditUser); } catch { /* ignore */ }
    setAssets((prev) => prev.filter((a) => a.id !== id));
    showNotification('Asset removed from register.');
  };

  // Inventory CRUD
  const saveInventoryItem = async (itemData: Partial<InventoryItem>) => {
    let saved: InventoryItem;
    try {
      const target = {
        ...itemData,
        id: itemData.id || `inv-${Date.now()}`
      } as InventoryItem;
      saved = await firestoreService.saveDocument('inventory', target);
      setInventory((prev) => {
        const exists = prev.some((i) => i.id === saved.id);
        return exists ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved];
      });
      showNotification(`Inventory item '${saved.itemName}' saved.`);
    } catch {
      try {
        if (itemData.id && inventory.some((i) => i.id === itemData.id)) {
          saved = await api.updateItem<InventoryItem>('inventory', itemData.id, itemData, auditUser);
          setInventory((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
        } else {
          saved = await api.createItem<InventoryItem>('inventory', itemData, auditUser);
          setInventory((prev) => [...prev, saved]);
        }
        showNotification(`Inventory item '${saved.itemName}' saved.`);
      } catch {
        saved = { ...itemData, id: itemData.id || `inv-${Date.now()}` } as InventoryItem;
        setInventory((prev) => { const e = prev.some((i) => i.id === saved.id); return e ? prev.map((i) => i.id === saved.id ? saved : i) : [...prev, saved]; });
        showNotification(`Inventory item '${saved.itemName}' saved.`);
      }
    }
    return saved;
  };

  const deleteInventoryItem = async (id: string) => {
    try { await firestoreService.deleteDocument('inventory', id); } catch { /* ignore */ }
    try { await api.deleteItem('inventory', id, auditUser); } catch { /* ignore */ }
    setInventory((prev) => prev.filter((i) => i.id !== id));
    showNotification('Inventory SKU deleted.');
  };

  const recordStockTransaction = async (params: {
    inventoryItemId: string;
    transactionType: string;
    quantity: number;
    reason?: string;
    targetBranchId?: string;
    referenceNumber?: string;
  }) => {
    try {
      const res = await api.recordStockTransaction({
        ...params,
        performedBy: currentUser?.name || 'Staff'
      });
      setInventory((prev) => prev.map((i) => (i.id === res.item.id ? res.item : i)));
      setStockTransactions((prev) => [res.transaction, ...prev]);
      try { await firestoreService.saveDocument('inventory', res.item); } catch { /* ignore */ }
    } catch {
      // Local fallback
      const item = inventory.find((i) => i.id === params.inventoryItemId);
      if (item) {
        let newStock = item.currentStock;
        if (params.transactionType === 'stock_in' || params.transactionType === 'transfer_in') {
          newStock = item.currentStock + params.quantity;
        } else if (['stock_out', 'consumption', 'transfer_out'].includes(params.transactionType)) {
          newStock = Math.max(0, item.currentStock - params.quantity);
        } else if (params.transactionType === 'adjustment') {
          newStock = params.quantity;
        }
        const updatedItem = { ...item, currentStock: newStock };
        setInventory((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
        const newTxn: StockTransaction = {
          id: `txn-${Date.now()}`,
          inventoryItemId: params.inventoryItemId,
          transactionType: params.transactionType,
          quantity: params.quantity,
          reason: params.reason || '',
          referenceNumber: params.referenceNumber || '',
          targetBranchId: params.targetBranchId || '',
          performedBy: currentUser?.name || 'Staff',
          date: new Date().toISOString()
        };
        setStockTransactions((prev) => [newTxn, ...prev]);
      }
    }
    showNotification(`Stock ${params.transactionType.replace('_', ' ')} recorded successfully.`);
  };

  // Purchases CRUD
  const savePurchaseOrder = async (poData: Partial<PurchaseOrder>) => {
    let saved: PurchaseOrder;
    try {
      const target = {
        ...poData,
        id: poData.id || `po-${Date.now()}`
      } as PurchaseOrder;
      saved = await firestoreService.saveDocument('purchases', target);
      setPurchases((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved];
      });
      showNotification(`Purchase Order '${saved.poNumber}' saved.`);
    } catch {
      try {
        if (poData.id && purchases.some((p) => p.id === poData.id)) {
          saved = await api.updateItem<PurchaseOrder>('purchases', poData.id, poData, auditUser);
          setPurchases((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        } else {
          saved = await api.createItem<PurchaseOrder>('purchases', poData, auditUser);
          setPurchases((prev) => [...prev, saved]);
        }
        showNotification(`Purchase Order '${saved.poNumber}' saved.`);
      } catch {
        saved = { ...poData, id: poData.id || `po-${Date.now()}` } as PurchaseOrder;
        setPurchases((prev) => { const e = prev.some((p) => p.id === saved.id); return e ? prev.map((p) => p.id === saved.id ? saved : p) : [...prev, saved]; });
        showNotification(`Purchase Order '${saved.poNumber}' saved.`);
      }
    }
    return saved;
  };

  const deletePurchaseOrder = async (id: string) => {
    try { await firestoreService.deleteDocument('purchases', id); } catch { /* ignore */ }
    try { await api.deleteItem('purchases', id, auditUser); } catch { /* ignore */ }
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    showNotification('Purchase order removed.');
  };

  // Suppliers CRUD
  const saveSupplier = async (supData: Partial<Supplier>) => {
    let saved: Supplier;
    try {
      const target = {
        ...supData,
        id: supData.id || `sup-${Date.now()}`
      } as Supplier;
      saved = await firestoreService.saveDocument('suppliers', target);
      setSuppliers((prev) => {
        const exists = prev.some((s) => s.id === saved.id);
        return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
      });
      showNotification(`Supplier '${saved.name}' saved.`);
    } catch {
      try {
        if (supData.id && suppliers.some((s) => s.id === supData.id)) {
          saved = await api.updateItem<Supplier>('suppliers', supData.id, supData, auditUser);
          setSuppliers((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        } else {
          saved = await api.createItem<Supplier>('suppliers', supData, auditUser);
          setSuppliers((prev) => [...prev, saved]);
        }
        showNotification(`Supplier '${saved.name}' saved.`);
      } catch {
        saved = { ...supData, id: supData.id || `sup-${Date.now()}` } as Supplier;
        setSuppliers((prev) => { const e = prev.some((s) => s.id === saved.id); return e ? prev.map((s) => s.id === saved.id ? saved : s) : [...prev, saved]; });
        showNotification(`Supplier '${saved.name}' saved.`);
      }
    }
    return saved;
  };

  const deleteSupplier = async (id: string) => {
    try { await firestoreService.deleteDocument('suppliers', id); } catch { /* ignore */ }
    try { await api.deleteItem('suppliers', id, auditUser); } catch { /* ignore */ }
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    showNotification('Supplier deleted.');
  };

  // Expenses CRUD
  const saveExpense = async (expData: Partial<Expense>) => {
    let saved: Expense;
    try {
      const target = {
        ...expData,
        id: expData.id || `exp-${Date.now()}`
      } as Expense;
      saved = await firestoreService.saveDocument('expenses', target);
      setExpenses((prev) => {
        const exists = prev.some((e) => e.id === saved.id);
        return exists ? prev.map((e) => (e.id === saved.id ? saved : e)) : [...prev, saved];
      });
      showNotification(`Expense voucher '${saved.referenceNumber}' saved.`);
    } catch {
      try {
        if (expData.id && expenses.some((e) => e.id === expData.id)) {
          saved = await api.updateItem<Expense>('expenses', expData.id, expData, auditUser);
          setExpenses((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
        } else {
          saved = await api.createItem<Expense>('expenses', expData, auditUser);
          setExpenses((prev) => [...prev, saved]);
        }
        showNotification(`Expense voucher '${saved.referenceNumber}' saved.`);
      } catch {
        saved = { ...expData, id: expData.id || `exp-${Date.now()}` } as Expense;
        setExpenses((prev) => { const e = prev.some((x) => x.id === saved.id); return e ? prev.map((x) => x.id === saved.id ? saved : x) : [...prev, saved]; });
        showNotification(`Expense voucher '${saved.referenceNumber}' saved.`);
      }
    }
    return saved;
  };

  const deleteExpense = async (id: string) => {
    try { await firestoreService.deleteDocument('expenses', id); } catch { /* ignore */ }
    try { await api.deleteItem('expenses', id, auditUser); } catch { /* ignore */ }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showNotification('Expense voucher removed.');
  };

  // Documents CRUD
  const saveDocument = async (docData: Partial<DocumentAttachment>) => {
    const target = {
      ...docData,
      id: docData.id || `doc-${Date.now()}`
    } as DocumentAttachment;
    try {
      await firestoreService.saveDocument('documents', target);
    } catch {
      await api.createItem<DocumentAttachment>('documents', docData, auditUser);
    }
    setDocuments((prev) => [...prev.filter((d) => d.id !== target.id), target]);
    showNotification(`Document '${target.title}' attached.`);
    return target;
  };

  const deleteDocument = async (id: string) => {
    try { await firestoreService.deleteDocument('documents', id); } catch { /* ignore */ }
    try { await api.deleteItem('documents', id, auditUser); } catch { /* ignore */ }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    showNotification('Document removed.');
  };

  // Settings
  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      await firestoreService.saveDocument('settings', { id: 'global', ...newSettings });
    } catch (e) {
      console.warn('Firestore settings update:', e);
    }
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
    } catch {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    }
    showNotification('System settings updated.');
  };

  // Users CRUD
  const saveUser = async (userData: Partial<User>) => {
    const target = {
      ...userData,
      id: userData.id || `usr-${Date.now()}`
    } as User;
    try {
      await firestoreService.saveDocument('users', target);
    } catch (e) {
      console.warn('Firestore user save:', e);
    }
    let saved: User;
    if (userData.id && users.some((u) => u.id === userData.id)) {
      saved = await api.updateItem<User>('users', userData.id, userData, auditUser);
      setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
    } else {
      saved = await api.createItem<User>('users', userData, auditUser);
      setUsers((prev) => [...prev, saved]);
    }
    showNotification(`User account '${saved.name}' saved.`);
    return saved;
  };

  const deleteUser = async (id: string) => {
    try {
      await firestoreService.deleteDocument('users', id);
    } catch (e) {
      console.warn('Firestore user delete:', e);
    }
    await api.deleteItem('users', id, auditUser);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    showNotification('User account deleted.');
  };

  // Recipe CRUD
  const saveRecipe = async (recipeData: Partial<Recipe>): Promise<Recipe> => {
    let saved: Recipe;
    const target = {
      ...recipeData,
      id: recipeData.id || `rcp-${Date.now()}`,
      updatedAt: new Date().toISOString(),
      createdAt: recipeData.createdAt || new Date().toISOString()
    } as Recipe;
    try {
      saved = await firestoreService.saveDocument('recipes', target);
    } catch {
      saved = target;
    }
    setRecipes((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved];
    });
    showNotification(`Recipe '${saved.name}' saved to Cloud Firestore.`);
    return saved;
  };

  const deleteRecipe = async (id: string): Promise<void> => {
    try {
      await firestoreService.deleteDocument('recipes', id);
    } catch (e) {
      console.warn('Delete recipe from firestore error:', e);
    }
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    showNotification('Recipe removed.');
  };

  // Bulk Import
  const bulkImport = async (collection: string, rows: any[]): Promise<number> => {
    const res = await api.importBulk(collection, rows, auditUser);
    await reloadState();
    const count = typeof res === 'number' ? res : res.count || 0;
    showNotification(`Bulk imported ${count} records into ${collection}.`);
    return count;
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        error,
        notification,
        clearNotification,
        selectedBranchId,
        setSelectedBranchId,
        activeBranch,
        settings,
        branches,
        projects,
        locations,
        constructionCosts,
        assets,
        inventory,
        stockTransactions,
        purchases,
        suppliers,
        expenses,
        documents,
        auditLogs,
        users,
        filteredProjects,
        filteredLocations,
        filteredConstructionCosts,
        filteredAssets,
        filteredInventory,
        filteredPurchases,
        filteredExpenses,
        filteredDocuments,
        getBranchCostBreakdown,
        alerts,
        reloadState,
        resetDemoData,
        saveBranch,
        deleteBranch,
        saveProject,
        deleteProject,
        saveLocation,
        deleteLocation,
        saveConstructionCost,
        deleteConstructionCost,
        saveAsset,
        deleteAsset,
        saveInventoryItem,
        deleteInventoryItem,
        recordStockTransaction,
        savePurchaseOrder,
        deletePurchaseOrder,
        saveSupplier,
        deleteSupplier,
        saveExpense,
        deleteExpense,
        saveDocument,
        deleteDocument,
        updateSettings,
        saveUser,
        deleteUser,
        recipes,
        saveRecipe,
        deleteRecipe,
        bulkImport
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
