import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Recipe,
  isSuperManagerRole,
  isManagerRole,
  getRoleDisplayName
} from '../types';
import {
  PRIMARY_OWNER_EMAILS,
  isUserMasterAdmin,
  getEffectivePermissions,
  normalizeCanonicalRole
} from '../utils/authorization';
import {
  firestoreService,
  QueryScopeOptions
} from '../services/firestoreService';
import { INITIAL_RECIPES, INITIAL_SETTINGS } from '../services/initialData';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { auth, isFirestoreNetworkError, forceFirestoreReconnect, testFirestoreConnection } from '../firebase';
import { persistentCache, LocalERPSnapshot } from '../utils/persistentCache';

const DEFAULT_BRANCH_ACCESS: readonly string[] = Object.freeze(['all']);

export type SyncStatus =
  | 'connecting'
  | 'loading'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'pending'
  | 'error';

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
  // Global State
  loading: boolean;
  error: string | null;
  notification: NotificationToast | null;
  clearNotification: () => void;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  activeBranch: Branch | undefined;
  
  // Enterprise Entities
  settings: SystemSettings;
  branches: Branch[];
  allBranches: Branch[];
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
  
  // Filtered views by active branch
  filteredProjects: Project[];
  filteredLocations: LocationArea[];
  filteredConstructionCosts: ConstructionCost[];
  filteredAssets: Asset[];
  filteredInventory: InventoryItem[];
  filteredPurchases: PurchaseOrder[];
  filteredExpenses: Expense[];
  filteredDocuments: DocumentAttachment[];
  
  // Computed & Aggregated
  getBranchCostBreakdown: (branchId: string) => BranchCostBreakdown;
  alerts: SystemAlert[];
  
  // Actions
  reloadState: (forceServer?: boolean) => Promise<void>;
  refreshCollection: (collection: string) => Promise<void>;
  forceReconnect: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  pendingWritesCount: number;
  lastSyncTime: string | null;
  
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
  saveUser: (
    user: Partial<User>,
    options?: {
      createInFirebaseAuth?: boolean;
      password?: string;
      sendWelcomeEmail?: boolean;
      mustChangePassword?: boolean;
    }
  ) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  changeUserPassword: (
    userId: string,
    newPassword: string,
    options?: { sendResetEmail?: boolean; mustChangePassword?: boolean }
  ) => Promise<User>;
  saveRecipe: (recipe: Partial<Recipe>) => Promise<Recipe>;
  deleteRecipe: (id: string) => Promise<void>;
  bulkImport: (collection: string, rows: any[]) => Promise<number>;
  getUserCollectionRef: (collectionName: string) => any;
  getUserDocRef: (collectionName: string, id: string) => any;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated, authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [pendingWritesCount, setPendingWritesCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const isSyncing = syncStatus === 'syncing' || syncStatus === 'loading' || syncStatus === 'pending' || syncStatus === 'connecting';
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

  // Entities State
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [allBranches, setBranches] = useState<Branch[]>([]);
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

  // Authoritative UID
  const getOwnerUid = useCallback(() => {
    return auth.currentUser?.uid || currentUser?.id || 'enterprise-owner';
  }, [currentUser?.id]);

  // Branch Access Control & Least-Privilege Scoping
  const isSuper = useMemo(() => {
    if (!currentUser) return false;
    return (
      isSuperManagerRole(currentUser.role) ||
      (typeof currentUser.email === 'string' && PRIMARY_OWNER_EMAILS.includes(currentUser.email.toLowerCase()))
    );
  }, [currentUser?.role, currentUser?.email]);

  const rawBranchIdsJoined = (currentUser?.assignedBranchIds || []).filter(Boolean).sort().join(',');

  const assignedBranchesKey = useMemo(() => {
    if (!currentUser || isSuper) return 'all';
    return rawBranchIdsJoined || 'all';
  }, [rawBranchIdsJoined, isSuper, !currentUser]);

  const userAssignedBranchIds = useMemo<readonly string[]>(() => {
    if (!currentUser || isSuper) return DEFAULT_BRANCH_ACCESS;
    const ids = currentUser.assignedBranchIds;
    return ids && ids.length > 0 ? ids : DEFAULT_BRANCH_ACCESS;
  }, [assignedBranchesKey, isSuper, !currentUser]);

  const hasGlobalBranchAccess = isSuper || userAssignedBranchIds.includes('all');

  const branches = useMemo(() => {
    if (hasGlobalBranchAccess) return allBranches;
    return allBranches.filter((b) => userAssignedBranchIds.includes(b.id));
  }, [allBranches, hasGlobalBranchAccess, assignedBranchesKey]);

  // Keep selectedBranchId aligned with user branch permissions safely without re-triggering loops
  useEffect(() => {
    if (hasGlobalBranchAccess) return;
    if (branches.length > 0) {
      const targetId = branches[0]?.id;
      if (!targetId) return;
      const isValid = selectedBranchId !== 'all' && userAssignedBranchIds.includes(selectedBranchId);
      if (!isValid && selectedBranchId !== targetId) {
        setSelectedBranchId(targetId);
      }
    }
  }, [hasGlobalBranchAccess, branches, selectedBranchId, userAssignedBranchIds]);

  const activeBranch = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Filtered collections (strictly bounded by user assignedBranchIds)
  const filteredProjects = useMemo(() => {
    const scoped = hasGlobalBranchAccess
      ? projects
      : projects.filter((p) => p.branchId && userAssignedBranchIds.includes(p.branchId));
    if (selectedBranchId === 'all') return scoped;
    return scoped.filter((p) => p.branchId === selectedBranchId);
  }, [projects, selectedBranchId, hasGlobalBranchAccess, userAssignedBranchIds]);

  const filteredLocations = useMemo(() => {
    const scoped = hasGlobalBranchAccess
      ? locations
      : locations.filter((l) => l.branchId && userAssignedBranchIds.includes(l.branchId));
    if (selectedBranchId === 'all') return scoped;
    return scoped.filter((l) => l.branchId === selectedBranchId);
  }, [locations, selectedBranchId, hasGlobalBranchAccess, userAssignedBranchIds]);

  const filteredConstructionCosts = useMemo(() => {
    const scoped = hasGlobalBranchAccess
      ? constructionCosts
      : constructionCosts.filter((c) => c.branchId && userAssignedBranchIds.includes(c.branchId));
    if (selectedBranchId === 'all') return scoped;
    return scoped.filter((c) => c.branchId === selectedBranchId);
  }, [constructionCosts, selectedBranchId, hasGlobalBranchAccess, userAssignedBranchIds]);

  const filteredAssets = useMemo(() => {
    const scoped = hasGlobalBranchAccess
      ? assets
      : assets.filter((a) => a.branchId && userAssignedBranchIds.includes(a.branchId));
    if (selectedBranchId === 'all') return scoped;
    return scoped.filter((a) => a.branchId === selectedBranchId);
  }, [assets, selectedBranchId, hasGlobalBranchAccess, userAssignedBranchIds]);

  const filteredInventory = useMemo(() => {
    const scoped = hasGlobalBranchAccess
      ? inventory
      : inventory.filter((i) => i.branchId && userAssignedBranchIds.includes(i.branchId));
    if (selectedBranchId === 'all') return scoped;
    return scoped.filter((i) => i.branchId === selectedBranchId);
  }, [inventory, selectedBranchId, hasGlobalBranchAccess, userAssignedBranchIds]);

  const filteredPurchases = useMemo(() => {
    const scoped = hasGlobalBranchAccess
      ? purchases
      : purchases.filter((p) => p.branchId && userAssignedBranchIds.includes(p.branchId));
    if (selectedBranchId === 'all') return scoped;
    return scoped.filter((p) => p.branchId === selectedBranchId);
  }, [purchases, selectedBranchId, hasGlobalBranchAccess, userAssignedBranchIds]);

  const filteredExpenses = useMemo(() => {
    const scoped = hasGlobalBranchAccess
      ? expenses
      : expenses.filter((e) => e.branchId && userAssignedBranchIds.includes(e.branchId));
    if (selectedBranchId === 'all') return scoped;
    return scoped.filter((e) => e.branchId === selectedBranchId);
  }, [expenses, selectedBranchId, hasGlobalBranchAccess, userAssignedBranchIds]);

  const filteredDocuments = useMemo(() => {
    const scoped = hasGlobalBranchAccess
      ? documents
      : documents.filter((d) => !d.branchId || userAssignedBranchIds.includes(d.branchId));
    if (selectedBranchId === 'all') return scoped;
    return scoped.filter((d) => d.branchId === selectedBranchId);
  }, [documents, selectedBranchId, hasGlobalBranchAccess, userAssignedBranchIds]);

  const applySnapshot = useCallback((snapshot: LocalERPSnapshot) => {
    if (snapshot.settings) setSettings(snapshot.settings);
    if (snapshot.branches) setBranches(snapshot.branches);
    if (snapshot.projects) setProjects(snapshot.projects);
    if (snapshot.locations) setLocations(snapshot.locations);
    if (snapshot.constructionCosts) setConstructionCosts(snapshot.constructionCosts);
    if (snapshot.assets) setAssets(snapshot.assets);
    if (snapshot.inventory) setInventory(snapshot.inventory);
    if (snapshot.stockTransactions) setStockTransactions(snapshot.stockTransactions);
    if (snapshot.purchases) setPurchases(snapshot.purchases);
    if (snapshot.suppliers) setSuppliers(snapshot.suppliers);
    if (snapshot.expenses) setExpenses(snapshot.expenses);
    if (snapshot.documents) setDocuments(snapshot.documents);
    if (snapshot.auditLogs) setAuditLogs(snapshot.auditLogs);
    if (snapshot.users) setUsers(snapshot.users);
    if (snapshot.recipes) setRecipes(snapshot.recipes);
  }, []);

  // Targeted single-collection refresh
  const refreshCollection = useCallback(async (collectionName: string) => {
    const currentUid = auth.currentUser?.uid || currentUser?.id;
    if (!currentUid) return;
    try {
      setSyncStatus('syncing');
      const queryOptions: QueryScopeOptions = {
        uid: currentUid,
        branchIds: userAssignedBranchIds,
        isSuper,
        userRole: currentUser?.role
      };
      const items = await firestoreService.getCollection<any>(collectionName, true, queryOptions);
      switch (collectionName) {
        case 'branches': setBranches(items); break;
        case 'projects': setProjects(items); break;
        case 'assets': setAssets(items); break;
        case 'constructionCosts': setConstructionCosts(items); break;
        case 'inventory': setInventory(items); break;
        case 'purchases': setPurchases(items); break;
        case 'suppliers': setSuppliers(items); break;
        case 'expenses': setExpenses(items); break;
        case 'locations': setLocations(items); break;
        case 'recipes': setRecipes(items); break;
        case 'stockTransactions': setStockTransactions(items); break;
        case 'documents': setDocuments(items); break;
        case 'auditLogs': setAuditLogs(items); break;
        case 'users': setUsers(items); break;
        default: break;
      }
      setSyncStatus('synced');
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.warn(`[Firestore] Targeted refresh for ${collectionName} warning:`, err);
      if (!navigator.onLine || isFirestoreNetworkError(err)) {
        setSyncStatus('offline');
      } else {
        setSyncStatus('error');
      }
    }
  }, [currentUser?.id, currentUser?.role, isSuper, assignedBranchesKey]);

  // Master State Loader: Firestore is the Single Authoritative Source of Truth
  const reloadState = useCallback(async (forceServer = false) => {
    setError(null);
    const currentUid = auth.currentUser?.uid || currentUser?.id;

    if (!currentUid || !isAuthenticated) {
      setLoading(false);
      return;
    }

    // 1. Instant Cache-First Hydration: Zero-latency application launch (< 20ms)
    const cached = persistentCache.loadSnapshot(currentUid);
    if (cached && !forceServer) {
      applySnapshot(cached);
      setLoading(false);
      setSyncStatus('syncing');
    } else {
      if (allBranches.length === 0) {
        setLoading(true);
      }
      setSyncStatus('connecting');
    }

    // 2. Parallel Background Synchronization with Cloud Firestore
    try {
      if (isSuper) {
        await firestoreService.seedInitialDataIfEmpty(true);
      }

      const queryOptions: QueryScopeOptions = {
        uid: currentUid,
        branchIds: userAssignedBranchIds,
        isSuper,
        userRole: currentUser?.role
      };

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
        fbRecipes,
        fbSettings,
        fbDocuments,
        fbStockTxns,
        fbAuditLogs,
        fbUsers
      ] = await Promise.all([
        firestoreService.getCollection<Branch>('branches', forceServer, queryOptions),
        firestoreService.getCollection<Project>('projects', forceServer, queryOptions),
        firestoreService.getCollection<Asset>('assets', forceServer, queryOptions),
        firestoreService.getCollection<ConstructionCost>('constructionCosts', forceServer, queryOptions),
        firestoreService.getCollection<InventoryItem>('inventory', forceServer, queryOptions),
        firestoreService.getCollection<PurchaseOrder>('purchases', forceServer, queryOptions),
        firestoreService.getCollection<Supplier>('suppliers', forceServer, queryOptions),
        firestoreService.getCollection<Expense>('expenses', forceServer, queryOptions),
        firestoreService.getCollection<LocationArea>('locations', forceServer, queryOptions),
        firestoreService.getCollection<Recipe>('recipes', forceServer, queryOptions),
        firestoreService.getDocument<SystemSettings>('settings', 'global'),
        firestoreService.getCollection<DocumentAttachment>('documents', forceServer, queryOptions),
        firestoreService.getCollection<StockTransaction>('stockTransactions', forceServer, queryOptions),
        (isSuper || isManagerRole(currentUser?.role))
          ? firestoreService.getCollection<AuditLog>('auditLogs', forceServer, queryOptions)
          : Promise.resolve([]),
        firestoreService.getCollection<User>('users', forceServer, queryOptions)
      ]);

      const nextBranches = fbBranches || [];
      const nextProjects = fbProjects || [];
      const nextAssets = fbAssets || [];
      const nextConstruction = fbConstruction || [];
      const nextInventory = fbInventory || [];
      const nextPurchases = fbPurchases || [];
      const nextSuppliers = fbSuppliers || [];
      const nextExpenses = fbExpenses || [];
      const nextLocations = fbLocations || [];
      const nextRecipes = fbRecipes && fbRecipes.length > 0 ? fbRecipes : INITIAL_RECIPES;
      const nextDocs = fbDocuments || [];
      const nextStock = fbStockTxns || [];
      const nextAudit = fbAuditLogs || [];
      const nextUsers = fbUsers && fbUsers.length > 0 ? fbUsers : [];

      setBranches(nextBranches);
      setProjects(nextProjects);
      setAssets(nextAssets);
      setConstructionCosts(nextConstruction);
      setInventory(nextInventory);
      setPurchases(nextPurchases);
      setSuppliers(nextSuppliers);
      setExpenses(nextExpenses);
      setLocations(nextLocations);
      setRecipes(nextRecipes);
      if (fbSettings) setSettings(fbSettings);
      setDocuments(nextDocs);
      setStockTransactions(nextStock);
      setAuditLogs(nextAudit);
      if (nextUsers.length > 0) setUsers(nextUsers);

      // Save persistent cache snapshot for speed and offline resilience
      persistentCache.saveSnapshot(currentUid, {
        branches: nextBranches,
        projects: nextProjects,
        locations: nextLocations,
        constructionCosts: nextConstruction,
        assets: nextAssets,
        inventory: nextInventory,
        stockTransactions: nextStock,
        purchases: nextPurchases,
        suppliers: nextSuppliers,
        expenses: nextExpenses,
        documents: nextDocs,
        auditLogs: nextAudit,
        users: nextUsers,
        recipes: nextRecipes,
        settings: fbSettings || settingsRef.current
      });

      setLastSyncTime(new Date().toISOString());
      setSyncStatus('synced');
    } catch (fbErr: any) {
      console.warn('[Firestore] Sync warning during reloadState:', fbErr);
      if (!navigator.onLine || isFirestoreNetworkError(fbErr)) {
        setSyncStatus('offline');
      } else {
        setSyncStatus('error');
        setError(fbErr.message || 'Database connection error');
      }
    } finally {
      setLoading(false);
    }
  }, [
    currentUser?.id,
    currentUser?.role,
    isAuthenticated,
    isSuper,
    assignedBranchesKey,
    applySnapshot
  ]);

  // Real-time synchronization: Scope listeners to authenticated user & role permissions
  useEffect(() => {
    const currentUid = auth.currentUser?.uid || currentUser?.id;
    if (!currentUid || !isAuthenticated || authLoading) return;

    const unsubs: Array<() => void> = [];
    const queryOptions: QueryScopeOptions = {
      uid: currentUid,
      branchIds: userAssignedBranchIds,
      isSuper,
      userRole: currentUser?.role
    };

    const markServerSync = (meta: { fromCache: boolean; hasPendingWrites: boolean }) => {
      if (meta.hasPendingWrites) {
        setSyncStatus('pending');
      } else if (!meta.fromCache) {
        setLastSyncTime(new Date().toISOString());
        setSyncStatus('synced');
      } else {
        setSyncStatus((prev) => (prev === 'connecting' || prev === 'loading' ? 'syncing' : prev));
      }
    };

    const sub = (collName: string, setter: (items: any[]) => void) => {
      try {
        const unsub = firestoreService.subscribeToCollection(
          collName,
          (items: any[], meta) => {
            setter(items);
            markServerSync(meta);
          },
          (err) => {
            console.warn(`[Firestore Realtime] Subscription notice for ${collName}:`, err);
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
              setSyncStatus('offline');
            } else if ((err as any)?.code === 'permission-denied') {
              console.warn(`[Firestore Permission Notice] Scope check for ${collName}`);
            } else if (isFirestoreNetworkError(err)) {
              // Browser is online, but firestore had a transient network hiccup:
              // Probe authoritative server connection before falsely marking offline
              testFirestoreConnection(2500).then((probe) => {
                if (probe.ok) {
                  setSyncStatus('synced');
                  setLastSyncTime(new Date().toISOString());
                } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
                  setSyncStatus('offline');
                }
              });
            } else {
              setSyncStatus('error');
            }
          },
          queryOptions
        );
        unsubs.push(unsub);
      } catch (e) {
        console.warn(`Could not subscribe to ${collName}:`, e);
      }
    };

    // Subscriptions to all live collections
    sub('branches', setBranches);
    sub('projects', setProjects);
    sub('assets', setAssets);
    sub('constructionCosts', setConstructionCosts);
    sub('inventory', setInventory);
    sub('purchases', setPurchases);
    sub('suppliers', setSuppliers);
    sub('expenses', setExpenses);
    sub('recipes', setRecipes);
    sub('locations', setLocations);
    sub('documents', setDocuments);
    sub('stockTransactions', setStockTransactions);
    sub('users', (loadedUsers) => {
      if (loadedUsers.length > 0) setUsers(loadedUsers);
    });

    if (isSuper || isManagerRole(currentUser?.role)) {
      sub('auditLogs', setAuditLogs);
    }

    // Subscribe to global settings document
    const unsubSettings = firestoreService.subscribeToDocument<SystemSettings>(
      'settings',
      'global',
      (item, meta) => {
        if (item) {
          setSettings(item);
          markServerSync(meta);
        }
      },
      (err) => {
        console.warn('[Firestore Realtime] Settings subscription notice:', err);
      }
    );
    unsubs.push(unsubSettings);

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [
    auth.currentUser?.uid,
    currentUser?.id,
    currentUser?.role,
    isAuthenticated,
    authLoading,
    isSuper,
    assignedBranchesKey
  ]);

  const reloadStateRef = useRef(reloadState);
  reloadStateRef.current = reloadState;

  // Explicit User/System Reconnect Handler
  const forceReconnect = useCallback(async () => {
    setSyncStatus('connecting');
    await forceFirestoreReconnect();
    await reloadStateRef.current(true);
  }, []);

  // Automatic Connection Recovery via Browser Online / Offline Events
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[Firestore] Browser online event detected. Restoring live database connection...');
      setSyncStatus('connecting');
      await forceFirestoreReconnect();
      await reloadStateRef.current(true);
    };

    const handleOffline = () => {
      console.log('[Firestore] Browser offline event detected. Switching to persistent local cache...');
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Active Connection Heartbeat & Automatic Self-Healing
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    let isDisposed = false;

    const performHealthCheck = async () => {
      if (isDisposed) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatus('offline');
        return;
      }

      // Check active backend probe
      const res = await testFirestoreConnection(3000);
      if (isDisposed) return;

      if (res.ok) {
        setLastSyncTime(new Date().toISOString());
        setSyncStatus((prev) => {
          if (prev === 'offline' || prev === 'connecting' || prev === 'syncing') {
            return 'synced';
          }
          return prev;
        });
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatus('offline');
      }
    };

    // Initial probe 1.5s after boot
    const initialTimer = setTimeout(performHealthCheck, 1500);
    // Periodic heartbeat every 20 seconds
    const intervalTimer = setInterval(performHealthCheck, 20000);

    return () => {
      isDisposed = true;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isAuthenticated, authLoading]);

  // Session Isolation: Reset state ONLY when user actually signs out (not on cold boot)
  const wasAuthenticatedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticatedRef.current = true;
    } else if (!authLoading && wasAuthenticatedRef.current) {
      wasAuthenticatedRef.current = false;
      setBranches([]);
      setProjects([]);
      setLocations([]);
      setConstructionCosts([]);
      setAssets([]);
      setInventory([]);
      setStockTransactions([]);
      setPurchases([]);
      setSuppliers([]);
      setExpenses([]);
      setDocuments([]);
      setAuditLogs([]);
      setUsers([]);
      setRecipes(INITIAL_RECIPES);
      setSyncStatus('connecting');
    }
  }, [isAuthenticated, authLoading]);

  // Authoritative State Hydration: strictly executed once per authenticated user session
  const lastHydratedUidRef = useRef<string | null>(null);
  const activeSessionUid = currentUser?.id || auth.currentUser?.uid;

  useEffect(() => {
    if (authLoading) return;
    if (!activeSessionUid || !isAuthenticated) {
      lastHydratedUidRef.current = null;
      return;
    }

    if (lastHydratedUidRef.current !== activeSessionUid) {
      lastHydratedUidRef.current = activeSessionUid;
      reloadStateRef.current();
    }
  }, [authLoading, isAuthenticated, activeSessionUid]);

  const resetDemoData = async () => {
    try {
      setLoading(true);
      await firestoreService.resetDemoDataInFirestore();
      await reloadState(true);
      showNotification('Successfully restored default multi-branch demo data to Cloud Firestore.');
    } catch (err: any) {
      console.error('Reset error:', err);
      showNotification(err.message || 'Reset failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper for Optimistic State with Rollback
  const withOptimisticMutation = async <T,>(
    optimisticAction: () => void,
    rollbackAction: () => void,
    databaseAction: () => Promise<T>,
    successMessage?: string,
    customErrorMessage?: string
  ): Promise<T> => {
    optimisticAction();
    try {
      setPendingWritesCount((c) => c + 1);
      setSyncStatus('pending');
      const result = await databaseAction();
      setLastSyncTime(new Date().toISOString());
      setSyncStatus('synced');
      if (successMessage) showNotification(successMessage);
      return result;
    } catch (err: any) {
      rollbackAction();
      console.error('[Firestore Mutation Error]:', err);
      if (!navigator.onLine || isFirestoreNetworkError(err)) {
        setSyncStatus('offline');
      } else {
        setSyncStatus('error');
      }
      showNotification(customErrorMessage || err.message || 'Operation failed.', 'error');
      throw err;
    } finally {
      setPendingWritesCount((c) => Math.max(0, c - 1));
    }
  };

  // ======================== CRUD Handlers (Direct Cloud Firestore) ========================

  const saveBranch = async (branchData: Partial<Branch>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...branchData,
      id: branchData.id || `br-${Date.now()}`,
      userId: ownerUid,
      createdAt: branchData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Branch;

    const previousBranches = [...allBranches];

    return withOptimisticMutation(
      () => {
        setBranches((prev) => {
          const exists = prev.some((b) => b.id === target.id);
          return exists ? prev.map((b) => (b.id === target.id ? target : b)) : [...prev, target];
        });
      },
      () => {
        setBranches(previousBranches);
      },
      async () => {
        const saved = await firestoreService.saveDocument('branches', target, ownerUid);
        setBranches((prev) => prev.map((b) => (b.id === saved.id ? saved : b)));
        return saved;
      },
      `Branch '${target.name}' saved to Cloud Firestore.`,
      `Unable to save this branch. Check your permissions.`
    );
  };

  const deleteBranch = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousBranches = [...allBranches];
    const previousSelected = selectedBranchId;
    const targetBranch = allBranches.find((b) => b.id === id);

    return withOptimisticMutation(
      () => {
        setBranches((prev) => prev.filter((b) => b.id !== id));
        if (selectedBranchId === id) setSelectedBranchId('all');
      },
      () => {
        setBranches(previousBranches);
        setSelectedBranchId(previousSelected);
      },
      async () => {
        await firestoreService.deleteDocument('branches', id, ownerUid);
      },
      `Branch '${targetBranch?.name || id}' deleted successfully.`
    );
  };

  const saveProject = async (projectData: Partial<Project>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...projectData,
      id: projectData.id || `proj-${Date.now()}`,
      userId: ownerUid,
      createdAt: projectData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Project;

    const previousProjects = [...projects];

    return withOptimisticMutation(
      () => {
        setProjects((prev) => {
          const exists = prev.some((p) => p.id === target.id);
          return exists ? prev.map((p) => (p.id === target.id ? target : p)) : [...prev, target];
        });
      },
      () => {
        setProjects(previousProjects);
      },
      async () => {
        const saved = await firestoreService.saveDocument('projects', target, ownerUid);
        setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        return saved;
      },
      `Setup project '${target.projectName}' saved.`
    );
  };

  const deleteProject = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousProjects = [...projects];

    return withOptimisticMutation(
      () => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      },
      () => {
        setProjects(previousProjects);
      },
      async () => {
        await firestoreService.deleteDocument('projects', id, ownerUid);
      },
      'Project removed.'
    );
  };

  const saveLocation = async (locData: Partial<LocationArea>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...locData,
      id: locData.id || `loc-${Date.now()}`,
      userId: ownerUid
    } as LocationArea;

    const previousLocations = [...locations];

    return withOptimisticMutation(
      () => {
        setLocations((prev) => {
          const exists = prev.some((l) => l.id === target.id);
          return exists ? prev.map((l) => (l.id === target.id ? target : l)) : [...prev, target];
        });
      },
      () => {
        setLocations(previousLocations);
      },
      async () => {
        const saved = await firestoreService.saveDocument('locations', target, ownerUid);
        setLocations((prev) => prev.map((l) => (l.id === saved.id ? saved : l)));
        return saved;
      },
      `Location '${target.name}' saved.`
    );
  };

  const deleteLocation = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousLocations = [...locations];

    return withOptimisticMutation(
      () => {
        setLocations((prev) => prev.filter((l) => l.id !== id));
      },
      () => {
        setLocations(previousLocations);
      },
      async () => {
        await firestoreService.deleteDocument('locations', id, ownerUid);
      },
      'Location removed.'
    );
  };

  const saveConstructionCost = async (costData: Partial<ConstructionCost>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...costData,
      id: costData.id || `cc-${Date.now()}`,
      userId: ownerUid,
      createdAt: costData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ConstructionCost;

    const previousCosts = [...constructionCosts];

    return withOptimisticMutation(
      () => {
        setConstructionCosts((prev) => {
          const exists = prev.some((c) => c.id === target.id);
          return exists ? prev.map((c) => (c.id === target.id ? target : c)) : [...prev, target];
        });
      },
      () => {
        setConstructionCosts(previousCosts);
      },
      async () => {
        const saved = await firestoreService.saveDocument('constructionCosts', target, ownerUid);
        setConstructionCosts((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
        return saved;
      },
      `Construction item '${target.description}' saved.`
    );
  };

  const deleteConstructionCost = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousCosts = [...constructionCosts];

    return withOptimisticMutation(
      () => {
        setConstructionCosts((prev) => prev.filter((c) => c.id !== id));
      },
      () => {
        setConstructionCosts(previousCosts);
      },
      async () => {
        await firestoreService.deleteDocument('constructionCosts', id, ownerUid);
      },
      'Construction cost record deleted.'
    );
  };

  const saveAsset = async (assetData: Partial<Asset>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...assetData,
      id: assetData.id || `ast-${Date.now()}`,
      userId: ownerUid,
      createdAt: assetData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Asset;

    const previousAssets = [...assets];

    return withOptimisticMutation(
      () => {
        setAssets((prev) => {
          const exists = prev.some((a) => a.id === target.id);
          return exists ? prev.map((a) => (a.id === target.id ? target : a)) : [...prev, target];
        });
      },
      () => {
        setAssets(previousAssets);
      },
      async () => {
        const saved = await firestoreService.saveDocument('assets', target, ownerUid);
        setAssets((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
        return saved;
      },
      `Asset '${target.itemName}' saved to register.`
    );
  };

  const deleteAsset = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousAssets = [...assets];

    return withOptimisticMutation(
      () => {
        setAssets((prev) => prev.filter((a) => a.id !== id));
      },
      () => {
        setAssets(previousAssets);
      },
      async () => {
        await firestoreService.deleteDocument('assets', id, ownerUid);
      },
      'Asset record removed.'
    );
  };

  const saveInventoryItem = async (itemData: Partial<InventoryItem>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...itemData,
      id: itemData.id || `inv-${Date.now()}`,
      userId: ownerUid,
      createdAt: itemData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as InventoryItem;

    const previousInventory = [...inventory];

    return withOptimisticMutation(
      () => {
        setInventory((prev) => {
          const exists = prev.some((i) => i.id === target.id);
          return exists ? prev.map((i) => (i.id === target.id ? target : i)) : [...prev, target];
        });
      },
      () => {
        setInventory(previousInventory);
      },
      async () => {
        const saved = await firestoreService.saveDocument('inventory', target, ownerUid);
        setInventory((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
        return saved;
      },
      `Inventory SKU '${target.itemName}' saved.`
    );
  };

  const deleteInventoryItem = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousInventory = [...inventory];

    return withOptimisticMutation(
      () => {
        setInventory((prev) => prev.filter((i) => i.id !== id));
      },
      () => {
        setInventory(previousInventory);
      },
      async () => {
        await firestoreService.deleteDocument('inventory', id, ownerUid);
      },
      'Inventory item removed.'
    );
  };

  const recordStockTransaction = async (params: {
    inventoryItemId: string;
    transactionType: string;
    quantity: number;
    reason?: string;
    targetBranchId?: string;
    referenceNumber?: string;
  }) => {
    const currentItem = inventory.find((i) => i.id === params.inventoryItemId);
    if (!currentItem) throw new Error('Item not found');

    const ownerUid = getOwnerUid();
    const qty = Number(params.quantity) || 0;
    let newIn = currentItem.stockIn;
    let newOut = currentItem.stockOut;
    let newAdj = currentItem.adjustments;

    if (params.transactionType === 'STOCK_IN') newIn += qty;
    else if (params.transactionType === 'STOCK_OUT') newOut += qty;
    else newAdj += qty;

    const newCurrent = currentItem.openingStock + newIn - newOut + newAdj;
    const newValue = newCurrent * currentItem.unitCost;

    const updatedItem: InventoryItem = {
      ...currentItem,
      userId: ownerUid,
      stockIn: newIn,
      stockOut: newOut,
      adjustments: newAdj,
      currentStock: newCurrent,
      stockValue: newValue,
      updatedAt: new Date().toISOString()
    };

    const newTxn: StockTransaction = {
      id: `txn-${Date.now()}`,
      inventoryItemId: params.inventoryItemId,
      itemName: currentItem.itemName,
      branchId: currentItem.branchId,
      userId: ownerUid,
      transactionType: params.transactionType as any,
      quantity: qty,
      date: new Date().toISOString(),
      performedBy: currentUser?.name || 'Staff',
      reason: params.reason || '',
      targetBranchId: params.targetBranchId,
      referenceNumber: params.referenceNumber || `TXN-${Date.now().toString().slice(-5)}`
    };

    const prevInventory = [...inventory];
    const prevTxns = [...stockTransactions];

    return withOptimisticMutation(
      () => {
        setInventory((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
        setStockTransactions((prev) => [newTxn, ...prev]);
      },
      () => {
        setInventory(prevInventory);
        setStockTransactions(prevTxns);
      },
      async () => {
        await firestoreService.executeBatchWrite([
          {
            type: 'set',
            collection: 'inventory',
            id: updatedItem.id,
            data: updatedItem
          },
          {
            type: 'set',
            collection: 'stockTransactions',
            id: newTxn.id,
            data: newTxn
          }
        ], ownerUid);
      },
      `Stock ${params.transactionType.replace('_', ' ')} recorded successfully.`
    );
  };

  const savePurchaseOrder = async (poData: Partial<PurchaseOrder>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...poData,
      id: poData.id || `po-${Date.now()}`,
      userId: ownerUid,
      createdAt: poData.createdAt || new Date().toISOString()
    } as PurchaseOrder;

    const previousPurchases = [...purchases];

    return withOptimisticMutation(
      () => {
        setPurchases((prev) => {
          const exists = prev.some((p) => p.id === target.id);
          return exists ? prev.map((p) => (p.id === target.id ? target : p)) : [...prev, target];
        });
      },
      () => {
        setPurchases(previousPurchases);
      },
      async () => {
        const saved = await firestoreService.saveDocument('purchases', target, ownerUid);
        setPurchases((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        return saved;
      },
      `Purchase Order '${target.poNumber}' saved.`
    );
  };

  const deletePurchaseOrder = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousPurchases = [...purchases];

    return withOptimisticMutation(
      () => {
        setPurchases((prev) => prev.filter((p) => p.id !== id));
      },
      () => {
        setPurchases(previousPurchases);
      },
      async () => {
        await firestoreService.deleteDocument('purchases', id, ownerUid);
      },
      'Purchase order removed.'
    );
  };

  const saveSupplier = async (supData: Partial<Supplier>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...supData,
      id: supData.id || `sup-${Date.now()}`,
      userId: ownerUid,
      createdAt: supData.createdAt || new Date().toISOString()
    } as Supplier;

    const previousSuppliers = [...suppliers];

    return withOptimisticMutation(
      () => {
        setSuppliers((prev) => {
          const exists = prev.some((s) => s.id === target.id);
          return exists ? prev.map((s) => (s.id === target.id ? target : s)) : [...prev, target];
        });
      },
      () => {
        setSuppliers(previousSuppliers);
      },
      async () => {
        const saved = await firestoreService.saveDocument('suppliers', target, ownerUid);
        setSuppliers((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        return saved;
      },
      `Supplier '${target.name}' saved.`
    );
  };

  const deleteSupplier = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousSuppliers = [...suppliers];

    return withOptimisticMutation(
      () => {
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
      },
      () => {
        setSuppliers(previousSuppliers);
      },
      async () => {
        await firestoreService.deleteDocument('suppliers', id, ownerUid);
      },
      'Supplier deleted.'
    );
  };

  const saveExpense = async (expData: Partial<Expense>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...expData,
      id: expData.id || `exp-${Date.now()}`,
      userId: ownerUid,
      createdAt: expData.createdAt || new Date().toISOString()
    } as Expense;

    const previousExpenses = [...expenses];

    return withOptimisticMutation(
      () => {
        setExpenses((prev) => {
          const exists = prev.some((e) => e.id === target.id);
          return exists ? prev.map((e) => (e.id === target.id ? target : e)) : [...prev, target];
        });
      },
      () => {
        setExpenses(previousExpenses);
      },
      async () => {
        const saved = await firestoreService.saveDocument('expenses', target, ownerUid);
        setExpenses((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
        return saved;
      },
      `Expense voucher '${target.referenceNumber}' saved.`
    );
  };

  const deleteExpense = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousExpenses = [...expenses];

    return withOptimisticMutation(
      () => {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      },
      () => {
        setExpenses(previousExpenses);
      },
      async () => {
        await firestoreService.deleteDocument('expenses', id, ownerUid);
      },
      'Expense voucher removed.'
    );
  };

  const saveDocument = async (docData: Partial<DocumentAttachment>) => {
    const ownerUid = getOwnerUid();
    const target = {
      ...docData,
      id: docData.id || `doc-${Date.now()}`,
      userId: ownerUid,
      createdAt: docData.createdAt || new Date().toISOString()
    } as DocumentAttachment;

    const previousDocs = [...documents];

    return withOptimisticMutation(
      () => {
        setDocuments((prev) => [...prev.filter((d) => d.id !== target.id), target]);
      },
      () => {
        setDocuments(previousDocs);
      },
      async () => {
        const saved = await firestoreService.saveDocument('documents', target, ownerUid);
        setDocuments((prev) => [...prev.filter((d) => d.id !== target.id), saved]);
        return saved;
      },
      `Document '${target.title}' attached.`
    );
  };

  const deleteDocument = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousDocs = [...documents];

    return withOptimisticMutation(
      () => {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      },
      () => {
        setDocuments(previousDocs);
      },
      async () => {
        await firestoreService.deleteDocument('documents', id, ownerUid);
      },
      'Document removed.'
    );
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const ownerUid = getOwnerUid();
    const updated = { ...settings, ...newSettings };
    const prevSettings = { ...settings };

    return withOptimisticMutation(
      () => {
        setSettings(updated);
      },
      () => {
        setSettings(prevSettings);
      },
      async () => {
        await firestoreService.saveDocument('settings', { id: 'global', userId: ownerUid, ...updated }, ownerUid);
      },
      'System settings updated.'
    );
  };

  const saveUser = async (
    userData: Partial<User>,
    options?: {
      createInFirebaseAuth?: boolean;
      password?: string;
      sendWelcomeEmail?: boolean;
      mustChangePassword?: boolean;
    }
  ): Promise<User> => {
    const ownerUid = getOwnerUid();
    const isMaster = isUserMasterAdmin(userData);
    const canonicalRole = isMaster ? 'super_manager' : normalizeCanonicalRole(userData.role, userData.email);
    const isNewUser = !userData.id;
    const initialPassword = options?.password || userData.password;
    const shouldSyncFirebaseAuth = (options?.createInFirebaseAuth !== false) && isNewUser && !!initialPassword && !!userData.email;

    let firebaseUid: string | undefined = userData.firebaseUid;
    let authSyncSuccess = false;

    // If new user and syncing to Firebase Authentication backend
    if (shouldSyncFirebaseAuth) {
      try {
        const authResult = await authService.adminCreateFirebaseUser(
          userData.email!,
          initialPassword!,
          userData.name
        );
        firebaseUid = authResult.uid;
        authSyncSuccess = true;
      } catch (authErr: any) {
        console.warn('Firebase Auth admin creation response:', authErr);
        const code = authErr?.code || '';
        if (code === 'auth/email-already-in-use') {
          // The user already exists in Firebase Auth backend - mark as synced
          authSyncSuccess = true;
        } else {
          const msg = authErr?.message || String(authErr);
          throw new Error(`Firebase Authentication registration failed: ${msg.replace('Firebase: ', '')}`);
        }
      }
    }

    const assignedId = firebaseUid || userData.id || `usr-${Date.now()}`;

    const target: User = {
      ...userData,
      id: assignedId,
      name: userData.name || 'User',
      email: userData.email || '',
      userId: ownerUid,
      role: canonicalRole,
      isMasterAdmin: isMaster ? true : (userData.isMasterAdmin || false),
      status: isMaster ? 'active' : (userData.status || 'active'),
      assignedBranchIds: isMaster ? ['all'] : (userData.assignedBranchIds?.length ? userData.assignedBranchIds : ['all']),
      firebaseUid: firebaseUid || userData.firebaseUid,
      firebaseAuthSynced: authSyncSuccess || userData.firebaseAuthSynced || (isNewUser && shouldSyncFirebaseAuth),
      mustChangePassword: options?.mustChangePassword ?? userData.mustChangePassword ?? false,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (initialPassword) {
      target.password = initialPassword;
      target.passwordLastChangedAt = new Date().toISOString();
    }

    // Automatically compute and attach effective permissions for Firestore storage
    target.permissions = getEffectivePermissions(target);

    // If requested to send welcome / password reset email via Firebase Auth
    if (options?.sendWelcomeEmail && target.email) {
      try {
        await authService.sendPasswordReset(target.email);
      } catch (resetErr) {
        console.warn('Could not dispatch welcome/reset email:', resetErr);
      }
    }

    // Sync with backend API server if running
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...target,
          _currentUser: { name: currentUser?.name || 'Administrator', role: currentUser?.role || 'super_manager' }
        })
      });
    } catch {
      // Non-fatal if server is purely client/static
    }

    const previousUsers = [...users];

    return withOptimisticMutation(
      () => {
        setUsers((prev) => {
          const exists = prev.some((u) => u.id === target.id);
          return exists ? prev.map((u) => (u.id === target.id ? target : u)) : [...prev, target];
        });
      },
      () => {
        setUsers(previousUsers);
      },
      async () => {
        const saved = await firestoreService.saveDocument('users', target, ownerUid);
        setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
        return saved;
      },
      `User account '${target.name}' (${getRoleDisplayName(target.role, isMaster)}) saved.`
    );
  };

  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (target && isUserMasterAdmin(target)) {
      throw new Error('The Master Admin account is permanently protected and cannot be deleted.');
    }
    const ownerUid = getOwnerUid();
    const previousUsers = [...users];

    return withOptimisticMutation(
      () => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      },
      () => {
        setUsers(previousUsers);
      },
      async () => {
        await firestoreService.deleteDocument('users', id, ownerUid);
      },
      'User account deleted.'
    );
  };

  const changeUserPassword = async (
    userId: string,
    newPassword: string,
    options?: { sendResetEmail?: boolean; mustChangePassword?: boolean }
  ): Promise<User> => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      throw new Error('User account not found.');
    }

    const ownerUid = getOwnerUid();
    const updatedUser: User = {
      ...target,
      password: newPassword,
      passwordLastChangedAt: new Date().toISOString(),
      mustChangePassword: options?.mustChangePassword ?? false,
      updatedAt: new Date().toISOString()
    };

    // If currently authenticated user is updating their own password in Firebase
    if (auth.currentUser && (auth.currentUser.uid === userId || auth.currentUser.email === target.email)) {
      try {
        await authService.updateCurrentUserPassword(newPassword);
      } catch (err: any) {
        console.warn('Could not update Firebase Auth current user password directly:', err);
      }
    }

    // Optionally send password reset email link
    if (options?.sendResetEmail && target.email) {
      try {
        await authService.sendPasswordReset(target.email);
      } catch (err: any) {
        console.warn('Could not send password reset email:', err);
      }
    }

    // Attempt to update backend API if accessible
    try {
      await fetch(`/api/users/${userId}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          mustChangePassword: options?.mustChangePassword,
          _currentUser: { name: currentUser?.name || 'Administrator', role: currentUser?.role || 'super_manager' }
        })
      });
    } catch {
      // Ignored for offline/static operations
    }

    const previousUsers = [...users];
    return withOptimisticMutation(
      () => {
        setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      },
      () => {
        setUsers(previousUsers);
      },
      async () => {
        const saved = await firestoreService.saveDocument('users', updatedUser, ownerUid);

        // Security Audit Log entry
        try {
          const auditEntry: Partial<AuditLog> = {
            id: `audit-${Date.now()}`,
            userId: currentUser?.id,
            userName: currentUser?.name || 'Administrator',
            userRole: currentUser?.role || 'super_manager',
            action: 'Updated',
            module: 'Security & Access',
            recordId: userId,
            summary: `Password changed for user ${target.name} (${target.email})`,
            timestamp: new Date().toISOString()
          };
          await firestoreService.saveDocument('auditLogs', auditEntry as any, ownerUid);
        } catch (auditErr) {
          console.warn('Could not write audit log for password update:', auditErr);
        }

        return saved;
      },
      `Password successfully updated for user '${target.name}'.`
    );
  };

  const saveRecipe = async (recipeData: Partial<Recipe>): Promise<Recipe> => {
    const ownerUid = getOwnerUid();
    const target = {
      ...recipeData,
      id: recipeData.id || `rcp-${Date.now()}`,
      userId: ownerUid,
      updatedAt: new Date().toISOString(),
      createdAt: recipeData.createdAt || new Date().toISOString()
    } as Recipe;

    const previousRecipes = [...recipes];

    return withOptimisticMutation(
      () => {
        setRecipes((prev) => {
          const exists = prev.some((r) => r.id === target.id);
          return exists ? prev.map((r) => (r.id === target.id ? target : r)) : [...prev, target];
        });
      },
      () => {
        setRecipes(previousRecipes);
      },
      async () => {
        const saved = await firestoreService.saveDocument('recipes', target, ownerUid);
        setRecipes((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        return saved;
      },
      `Recipe '${target.name}' saved.`
    );
  };

  const deleteRecipe = async (id: string) => {
    const ownerUid = getOwnerUid();
    const previousRecipes = [...recipes];

    return withOptimisticMutation(
      () => {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      },
      () => {
        setRecipes(previousRecipes);
      },
      async () => {
        await firestoreService.deleteDocument('recipes', id, ownerUid);
      },
      'Recipe removed.'
    );
  };

  const bulkImport = async (collectionName: string, rows: any[]): Promise<number> => {
    try {
      setSyncStatus('pending');
      setPendingWritesCount((c) => c + rows.length);
      const ownerUid = getOwnerUid();
      const batchOps = rows.map((row, idx) => ({
        type: 'set' as const,
        collection: collectionName,
        id: row.id || `${collectionName.slice(0, 3)}-${Date.now()}-${idx}`,
        data: {
          ...row,
          userId: ownerUid,
          updatedAt: new Date().toISOString()
        }
      }));

      // Chunk batches into max 400 operations per commit
      const CHUNK_SIZE = 400;
      for (let i = 0; i < batchOps.length; i += CHUNK_SIZE) {
        const chunk = batchOps.slice(i, i + CHUNK_SIZE);
        await firestoreService.executeBatchWrite(chunk, ownerUid);
      }

      await refreshCollection(collectionName);
      setSyncStatus('synced');
      setLastSyncTime(new Date().toISOString());
      showNotification(`Bulk imported ${rows.length} records into ${collectionName}.`);
      return rows.length;
    } catch (err: any) {
      console.error('[Firestore] Bulk import error:', err);
      setSyncStatus('error');
      showNotification(err.message || 'Bulk import failed.', 'error');
      throw err;
    } finally {
      setPendingWritesCount(0);
    }
  };

  // Branch Cost Breakdown calculation
  const getBranchCostBreakdown = useCallback(
    (branchId: string): BranchCostBreakdown => {
      const branch = allBranches.find((b) => b.id === branchId);
      const branchCosts = constructionCosts.filter((c) => c.branchId === branchId);
      const branchAssets = assets.filter((a) => a.branchId === branchId);
      const branchExpenses = expenses.filter((e) => e.branchId === branchId);

      const construction = branchCosts.reduce((sum, c) => sum + (Number(c.totalCost) || 0), 0);
      const electrical = branchAssets
        .filter((a) => a.category === 'electrical' || a.category === 'lighting')
        .reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
      const lighting = branchAssets
        .filter((a) => a.category === 'lighting')
        .reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
      const hvac = branchAssets
        .filter((a) => a.category === 'hvac')
        .reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
      const furniture = branchAssets
        .filter((a) => a.category === 'furniture')
        .reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
      const kitchen = branchAssets
        .filter((a) => a.category === 'kitchen')
        .reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
      const it_pos = branchAssets
        .filter((a) => a.category === 'it_pos')
        .reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
      const general = branchAssets
        .filter((a) => a.category === 'general')
        .reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);

      const assetTotal = branchAssets.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);
      const expenseTotal = branchExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const totalActual = construction + assetTotal + expenseTotal;
      const branchProjects = projects.filter((p) => p.branchId === branchId);
      const estimatedBudget =
        branchProjects.reduce((sum, p) => sum + (Number(p.estimatedBudget) || 0), 0) ||
        Number((branch as any)?.totalBudget) ||
        0;
      const remainingBudget = estimatedBudget - totalActual;
      const isOverBudget = totalActual > estimatedBudget && estimatedBudget > 0;

      return {
        branchId,
        construction,
        electrical,
        lighting,
        hvac,
        furniture,
        kitchen,
        it_pos,
        general,
        assetTotal,
        expenses: expenseTotal,
        totalActual,
        estimatedBudget,
        remainingBudget,
        isOverBudget
      };
    },
    [allBranches, constructionCosts, assets, expenses, projects]
  );

  // System Alerts Engine
  const alerts = useMemo<SystemAlert[]>(() => {
    const list: SystemAlert[] = [];

    // Low stock warnings
    inventory.forEach((item) => {
      if (item.currentStock <= item.minimumLevel) {
        list.push({
          id: `alert-stock-${item.id}`,
          type: item.currentStock <= 0 ? 'danger' : 'warning',
          title: item.currentStock <= 0 ? 'Stock Depleted (Out of Stock)' : 'Low Stock Warning',
          message: `${item.itemName} (${item.itemCode}) has ${item.currentStock} ${item.unit} remaining (min: ${item.minimumLevel}).`,
          module: 'Inventory'
        });
      }
    });

    // Budget overruns
    allBranches.forEach((b) => {
      const breakdown = getBranchCostBreakdown(b.id);
      if (breakdown.isOverBudget) {
        list.push({
          id: `alert-budget-${b.id}`,
          type: 'danger',
          title: 'Budget Threshold Exceeded',
          message: `${b.name} has incurred ${settings.currencySymbol} ${breakdown.totalActual.toLocaleString()} against budget of ${settings.currencySymbol} ${breakdown.estimatedBudget.toLocaleString()}.`,
          module: 'Projects',
          branchName: b.name
        });
      }
    });

    return list;
  }, [inventory, allBranches, getBranchCostBreakdown, settings.currencySymbol]);

  const getUserCollectionRef = (collectionName: string) => {
    return firestoreService.getScopedCollectionRef(collectionName);
  };

  const getUserDocRef = (collectionName: string, id: string) => {
    return firestoreService.getScopedDocRef(collectionName, id);
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        isSyncing,
        syncStatus,
        pendingWritesCount,
        lastSyncTime,
        error,
        notification,
        clearNotification,
        selectedBranchId,
        setSelectedBranchId,
        activeBranch,
        settings,
        branches,
        allBranches,
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
        refreshCollection,
        forceReconnect,
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
        changeUserPassword,
        recipes,
        saveRecipe,
        deleteRecipe,
        bulkImport,
        getUserCollectionRef,
        getUserDocRef,
        showNotification
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const getUserCollectionRef = (collectionName: string) => {
  return firestoreService.getScopedCollectionRef(collectionName);
};

export const getUserDocRef = (collectionName: string, id: string) => {
  return firestoreService.getScopedDocRef(collectionName, id);
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
