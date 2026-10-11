import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  documentId,
  limit,
  Query,
  DocumentData
} from 'firebase/firestore';
import {
  db,
  auth,
  handleFirestoreError,
  logFirestoreDiagnosticError,
  OperationType
} from '../firebase';
import { perfMonitor } from '../utils/performanceMonitor';
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
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_BRANCHES,
  INITIAL_PROJECTS,
  INITIAL_LOCATIONS,
  INITIAL_CONSTRUCTION,
  INITIAL_ASSETS,
  INITIAL_INVENTORY,
  INITIAL_PURCHASES,
  INITIAL_SUPPLIERS,
  INITIAL_EXPENSES,
  INITIAL_RECIPES
} from './initialData';

// Cache structure for high-speed local data retrieval
interface CacheEntry<T> {
  data: T[];
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

let _hasCheckedSeeding = false;
let _lastCachedUid: string | null = null;

export const BRANCH_SCOPED_COLLECTIONS = new Set([
  'projects',
  'assets',
  'constructionCosts',
  'inventory',
  'purchases',
  'expenses',
  'locations',
  'documents',
  'stockTransactions'
]);

export interface QueryScopeOptions {
  uid?: string;
  branchIds?: string[] | readonly string[];
  isSuper?: boolean;
  userRole?: string;
}

/**
 * Returns a CollectionReference conforming to Firestore Security Rules.
 * All domain entities are stored in root collections (e.g. /branches, /projects, /assets).
 * The user directory resides at /users.
 */
export function getScopedCollectionRef(collectionName: string) {
  return collection(db, collectionName);
}

/**
 * Returns a DocumentReference conforming to Firestore Security Rules.
 * All domain entity documents are stored at /{collectionName}/{id}.
 * User profiles reside at /users/{id}.
 */
export function getScopedDocRef(collectionName: string, id: string) {
  return doc(db, collectionName, id);
}

/**
 * Builds a Firestore Query aligned strictly with Firestore Security Rules.
 * Security Rules are not filters: queries on branch-restricted collections must be
 * constrained with where clauses unless the user has global branch access.
 */
export function buildCollectionQuery(
  collectionName: string,
  options?: QueryScopeOptions
): Query<DocumentData> | null {
  const isSuper = options?.isSuper ?? false;
  const branchIds = (options?.branchIds || []).filter((id) => id && id.trim() !== '');
  const hasGlobalBranchAccess = isSuper || branchIds.includes('all');

  // 1. Audit logs: Disallowed for Staff by security rules
  if (collectionName === 'auditLogs') {
    if (options?.userRole === 'staff') {
      return null;
    }
    return collection(db, 'auditLogs');
  }

  // 2. Global collections without branch scoping
  if (
    collectionName === 'settings' ||
    collectionName === 'suppliers' ||
    collectionName === 'recipes' ||
    collectionName === 'users'
  ) {
    return collection(db, collectionName);
  }

  // 3. Branches collection (document ID is the branchId)
  if (collectionName === 'branches') {
    if (hasGlobalBranchAccess) {
      return collection(db, 'branches');
    }
    const permittedBranchIds = branchIds.filter((id) => id !== 'all');
    if (permittedBranchIds.length === 0) {
      return null;
    }
    return query(collection(db, 'branches'), where(documentId(), 'in', permittedBranchIds.slice(0, 30)));
  }

  // 4. Branch-scoped business entities
  if (BRANCH_SCOPED_COLLECTIONS.has(collectionName)) {
    if (hasGlobalBranchAccess) {
      return collection(db, collectionName);
    }
    const permittedBranchIds = branchIds.filter((id) => id !== 'all');
    if (permittedBranchIds.length === 0) {
      return null;
    }
    return query(collection(db, collectionName), where('branchId', 'in', permittedBranchIds.slice(0, 30)));
  }

  // Default fallback to root collection
  return collection(db, collectionName);
}

export const firestoreService = {
  // Invalidate in-memory cache for a specific collection or all
  invalidateCache(collectionName?: string) {
    if (collectionName) {
      memoryCache.delete(collectionName);
    } else {
      memoryCache.clear();
    }
  },

  // Export collection and document reference helpers directly
  getScopedCollectionRef,
  getScopedDocRef,
  buildCollectionQuery,

  // Optimized Fetch Collection with branch-scoping, deduplication and in-memory TTL caching
  async getCollection<T>(
    collectionName: string,
    forceFresh = false,
    options?: QueryScopeOptions
  ): Promise<T[]> {
    const currentUid = options?.uid || auth.currentUser?.uid;
    if (!currentUid) {
      return [];
    }

    // Reset cache if authenticated user switched accounts
    if (_lastCachedUid && _lastCachedUid !== currentUid) {
      memoryCache.clear();
      inFlightRequests.clear();
      _hasCheckedSeeding = false;
    }
    _lastCachedUid = currentUid;

    const queryRef = buildCollectionQuery(collectionName, options);
    if (!queryRef) {
      return [];
    }

    const now = Date.now();
    const cacheKey = `${currentUid}_${collectionName}_${JSON.stringify(options?.branchIds || [])}`;
    const cached = memoryCache.get(cacheKey);

    // 1. Return cached results immediately if fresh
    if (!forceFresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
      perfMonitor.trackRead(collectionName, cached.data.length, 0, true);
      return cached.data;
    }

    // 2. Deduplicate concurrent in-flight queries
    if (inFlightRequests.has(cacheKey)) {
      perfMonitor.trackDeduplication(collectionName);
      return inFlightRequests.get(cacheKey)!;
    }

    // 3. Execute Firestore query with duration tracking
    const startTime = performance.now();
    const queryPromise = (async () => {
      try {
        const snap = await getDocs(queryRef);
        const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T));
        const duration = performance.now() - startTime;

        perfMonitor.trackRead(collectionName, items.length, duration, false);
        memoryCache.set(cacheKey, { data: items, timestamp: Date.now() });
        return items;
      } catch (err) {
        logFirestoreDiagnosticError(err, OperationType.LIST, collectionName, {
          role: options?.userRole,
          branchScope: options?.branchIds
        });
        return [];
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    inFlightRequests.set(cacheKey, queryPromise);
    return queryPromise;
  },

  // Single document getter from root collection
  async getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = getScopedDocRef(collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (err) {
      logFirestoreDiagnosticError(err, OperationType.GET, `${collectionName}/${id}`);
      return null;
    }
  },

  // Save document (Create or Update) to root collection
  async saveDocument<T extends { id: string }>(
    collectionName: string,
    item: T,
    uid?: string
  ): Promise<T> {
    const currentUid = uid || auth.currentUser?.uid;

    // Security Hardening: Never persist password in any Firestore document
    const sanitizedItem: any = { ...item };
    if ('password' in sanitizedItem) {
      delete sanitizedItem.password;
    }

    const enrichedItem = {
      ...sanitizedItem,
      userId: sanitizedItem.userId || currentUid,
      updatedAt: new Date().toISOString(),
      createdAt: sanitizedItem.createdAt || new Date().toISOString()
    };

    // Update in-memory cache immediately (optimistic cache sync)
    const cacheKeyPrefix = `${currentUid}_${collectionName}`;
    for (const [key, cached] of memoryCache.entries()) {
      if (key.startsWith(cacheKeyPrefix)) {
        const existsIndex = cached.data.findIndex((d: any) => d.id === item.id);
        if (existsIndex >= 0) {
          cached.data[existsIndex] = enrichedItem;
        } else {
          cached.data.push(enrichedItem);
        }
        cached.timestamp = Date.now();
      }
    }

    const startTime = performance.now();
    const targetPath = `${collectionName}/${item.id}`;

    try {
      const docRef = getScopedDocRef(collectionName, item.id);
      await setDoc(docRef, enrichedItem, { merge: true });
      const duration = performance.now() - startTime;
      perfMonitor.trackWrite(collectionName, item.id, duration, false);
      return enrichedItem as T;
    } catch (err) {
      logFirestoreDiagnosticError(err, OperationType.WRITE, targetPath);
      handleFirestoreError(err, OperationType.WRITE, targetPath);
      throw err;
    }
  },

  // Delete document from root collection
  async deleteDocument(collectionName: string, id: string, uid?: string): Promise<void> {
    const currentUid = uid || auth.currentUser?.uid;
    const cacheKeyPrefix = `${currentUid}_${collectionName}`;

    // Evict from in-memory cache immediately
    for (const [key, cached] of memoryCache.entries()) {
      if (key.startsWith(cacheKeyPrefix)) {
        cached.data = cached.data.filter((d: any) => d.id !== id);
        cached.timestamp = Date.now();
      }
    }

    const startTime = performance.now();
    try {
      const docRef = getScopedDocRef(collectionName, id);
      await deleteDoc(docRef);
      const duration = performance.now() - startTime;
      perfMonitor.trackDelete(collectionName, id, duration);
    } catch (err) {
      logFirestoreDiagnosticError(err, OperationType.DELETE, `${collectionName}/${id}`);
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
      throw err;
    }
  },

  // Fast Batched Writes to root collections
  async executeBatchWrite(
    operations: Array<{
      type: 'set' | 'delete';
      collection: string;
      id: string;
      data?: any;
    }>,
    uid?: string
  ): Promise<void> {
    const currentUid = uid || auth.currentUser?.uid;
    if (operations.length === 0) return;

    const batch = writeBatch(db);
    const collectionsToInvalidate = new Set<string>();

    for (const op of operations) {
      const docRef = getScopedDocRef(op.collection, op.id);
      collectionsToInvalidate.add(`${currentUid}_${op.collection}`);

      if (op.type === 'delete') {
        batch.delete(docRef);
      } else {
        const enriched = {
          ...op.data,
          id: op.id,
          userId: (op.data as any)?.userId || currentUid,
          updatedAt: new Date().toISOString()
        };
        batch.set(docRef, enriched, { merge: true });
      }
    }

    const startTime = performance.now();
    try {
      await batch.commit();
      const duration = performance.now() - startTime;
      perfMonitor.trackWrite('batch', `batch-${operations.length}`, duration, true);

      // Invalidate modified collections in cache
      for (const [key] of memoryCache.entries()) {
        for (const coll of collectionsToInvalidate) {
          if (key.startsWith(coll)) {
            memoryCache.delete(key);
          }
        }
      }
    } catch (err) {
      logFirestoreDiagnosticError(err, OperationType.WRITE, `batch/${operations.length}`);
      handleFirestoreError(err, OperationType.WRITE, `batch/${operations.length}`);
      throw err;
    }
  },

  // Real-time listener with branch-scoping, snapshot metadata handling, and self-healing auto-reconnect
  subscribeToCollection<T>(
    collectionName: string,
    onData: (items: T[], metadata: { fromCache: boolean; hasPendingWrites: boolean }) => void,
    onError?: (error: any) => void,
    options?: QueryScopeOptions
  ): () => void {
    const currentUid = options?.uid || auth.currentUser?.uid;
    if (!currentUid) {
      return () => {};
    }

    const queryRef = buildCollectionQuery(collectionName, options);
    if (!queryRef) {
      // Role or branch restrictions mean this collection should return empty
      onData([], { fromCache: false, hasPendingWrites: false });
      return () => {};
    }

    const cacheKey = `${currentUid}_${collectionName}_${JSON.stringify(options?.branchIds || [])}`;

    let isDisposed = false;
    let currentUnsub: (() => void) | null = null;
    let retryTimer: any = null;
    let retryAttempts = 0;

    const startListener = () => {
      if (isDisposed) return;
      try {
        currentUnsub = onSnapshot(
          queryRef,
          { includeMetadataChanges: true },
          (snapshot) => {
            retryAttempts = 0; // successfully received snapshot
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
            memoryCache.set(cacheKey, { data: items, timestamp: Date.now() });
            onData(items, {
              fromCache: snapshot.metadata.fromCache,
              hasPendingWrites: snapshot.metadata.hasPendingWrites
            });
          },
          (error) => {
            logFirestoreDiagnosticError(error, OperationType.SUBSCRIBE, collectionName, {
              role: options?.userRole,
              branchScope: options?.branchIds
            });
            if (onError) onError(error);

            // Self-healing: if Firestore stream was terminated by network hiccup, auto-resubscribe
            if (!isDisposed) {
              const backoffMs = Math.min(1000 * Math.pow(1.5, retryAttempts), 10000);
              retryAttempts++;
              retryTimer = setTimeout(() => {
                if (!isDisposed) {
                  startListener();
                }
              }, backoffMs);
            }
          }
        );
      } catch (err) {
        if (!isDisposed) {
          retryTimer = setTimeout(startListener, 2000);
        }
      }
    };

    startListener();

    return () => {
      isDisposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (currentUnsub) currentUnsub();
    };
  },

  // Real-time listener for a single document (e.g. system settings) with self-healing reconnect
  subscribeToDocument<T>(
    collectionName: string,
    id: string,
    onData: (item: T | null, metadata: { fromCache: boolean; hasPendingWrites: boolean }) => void,
    onError?: (error: any) => void
  ): () => void {
    const docRef = getScopedDocRef(collectionName, id);

    let isDisposed = false;
    let currentUnsub: (() => void) | null = null;
    let retryTimer: any = null;
    let retryAttempts = 0;

    const startListener = () => {
      if (isDisposed) return;
      try {
        currentUnsub = onSnapshot(
          docRef,
          { includeMetadataChanges: true },
          (snapshot) => {
            retryAttempts = 0;
            const item = snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
            onData(item, {
              fromCache: snapshot.metadata.fromCache,
              hasPendingWrites: snapshot.metadata.hasPendingWrites
            });
          },
          (error) => {
            logFirestoreDiagnosticError(error, OperationType.SUBSCRIBE, `${collectionName}/${id}`);
            if (onError) onError(error);

            if (!isDisposed) {
              const backoffMs = Math.min(1000 * Math.pow(1.5, retryAttempts), 10000);
              retryAttempts++;
              retryTimer = setTimeout(() => {
                if (!isDisposed) {
                  startListener();
                }
              }, backoffMs);
            }
          }
        );
      } catch (err) {
        if (!isDisposed) {
          retryTimer = setTimeout(startListener, 2000);
        }
      }
    };

    startListener();

    return () => {
      isDisposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (currentUnsub) currentUnsub();
    };
  },

  // Ultra-fast seed initial dataset using batched writes (Runs once per session per UID for Super Manager only)
  async seedInitialDataIfEmpty(isSuper = false): Promise<boolean> {
    if (!auth.currentUser || !isSuper) return false;
    const currentUid = auth.currentUser.uid;

    if (_lastCachedUid && _lastCachedUid !== currentUid) {
      _hasCheckedSeeding = false;
    }
    _lastCachedUid = currentUid;

    if (_hasCheckedSeeding) return true;

    try {
      const sessionKey = `resto_seeded_${currentUid}`;
      if (sessionStorage.getItem(sessionKey) === 'true') {
        _hasCheckedSeeding = true;
        return true;
      }

      // 1. Fast check: Inspect if branches already exist in root collection with limit(1)
      const branchesRef = getScopedCollectionRef('branches');
      const branchSnap = await getDocs(query(branchesRef, limit(1)));
      if (!branchSnap.empty) {
        _hasCheckedSeeding = true;
        sessionStorage.setItem(sessionKey, 'true');
        return true;
      }

      // 2. Database is unseeded: Use atomic Batched Write to write default enterprise baseline
      const batch = writeBatch(db);

      // Settings
      batch.set(getScopedDocRef('settings', 'global'), { ...INITIAL_SETTINGS, id: 'global', userId: currentUid });

      // Core entities
      for (const b of INITIAL_BRANCHES) batch.set(getScopedDocRef('branches', b.id), { ...b, userId: currentUid });
      for (const p of INITIAL_PROJECTS) batch.set(getScopedDocRef('projects', p.id), { ...p, userId: currentUid });
      for (const l of INITIAL_LOCATIONS) batch.set(getScopedDocRef('locations', l.id), { ...l, userId: currentUid });
      for (const c of INITIAL_CONSTRUCTION) batch.set(getScopedDocRef('constructionCosts', c.id), { ...c, userId: currentUid });
      for (const a of INITIAL_ASSETS) batch.set(getScopedDocRef('assets', a.id), { ...a, userId: currentUid });
      for (const i of INITIAL_INVENTORY) batch.set(getScopedDocRef('inventory', i.id), { ...i, userId: currentUid });
      for (const po of INITIAL_PURCHASES) batch.set(getScopedDocRef('purchases', po.id), { ...po, userId: currentUid });
      for (const s of INITIAL_SUPPLIERS) batch.set(getScopedDocRef('suppliers', s.id), { ...s, userId: currentUid });
      for (const e of INITIAL_EXPENSES) batch.set(getScopedDocRef('expenses', e.id), { ...e, userId: currentUid });
      for (const r of INITIAL_RECIPES) batch.set(getScopedDocRef('recipes', r.id), { ...r, userId: currentUid });

      await batch.commit();
      _hasCheckedSeeding = true;
      sessionStorage.setItem(sessionKey, 'true');
      memoryCache.clear();
      return true;
    } catch (err) {
      logFirestoreDiagnosticError(err, OperationType.WRITE, 'seedInitialData');
      _hasCheckedSeeding = true;
      return false;
    }
  },

  // Reset Firestore to default demo data using batched writes
  async resetDemoDataInFirestore(): Promise<void> {
    if (!auth.currentUser) {
      console.warn('Cannot reset Firestore while unauthenticated.');
      return;
    }

    const currentUid = auth.currentUser.uid;
    const batch = writeBatch(db);

    batch.set(getScopedDocRef('settings', 'global'), { ...INITIAL_SETTINGS, id: 'global', userId: currentUid });
    for (const b of INITIAL_BRANCHES) batch.set(getScopedDocRef('branches', b.id), { ...b, userId: currentUid });
    for (const p of INITIAL_PROJECTS) batch.set(getScopedDocRef('projects', p.id), { ...p, userId: currentUid });
    for (const l of INITIAL_LOCATIONS) batch.set(getScopedDocRef('locations', l.id), { ...l, userId: currentUid });
    for (const c of INITIAL_CONSTRUCTION) batch.set(getScopedDocRef('constructionCosts', c.id), { ...c, userId: currentUid });
    for (const a of INITIAL_ASSETS) batch.set(getScopedDocRef('assets', a.id), { ...a, userId: currentUid });
    for (const i of INITIAL_INVENTORY) batch.set(getScopedDocRef('inventory', i.id), { ...i, userId: currentUid });
    for (const po of INITIAL_PURCHASES) batch.set(getScopedDocRef('purchases', po.id), { ...po, userId: currentUid });
    for (const s of INITIAL_SUPPLIERS) batch.set(getScopedDocRef('suppliers', s.id), { ...s, userId: currentUid });
    for (const exp of INITIAL_EXPENSES) batch.set(getScopedDocRef('expenses', exp.id), { ...exp, userId: currentUid });
    for (const r of INITIAL_RECIPES) batch.set(getScopedDocRef('recipes', r.id), { ...r, userId: currentUid });

    await batch.commit();
    memoryCache.clear();
    _hasCheckedSeeding = true;
  }
};
