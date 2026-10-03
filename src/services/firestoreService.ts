import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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

export const firestoreService = {
  // Fetch collection
  async getCollection<T>(collectionName: string): Promise<T[]> {
    try {
      const snap = await getDocs(collection(db, collectionName));
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, collectionName);
      return [];
    }
  },

  // Save document (Create or Update)
  async saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
    const docRef = doc(db, collectionName, item.id);
    try {
      await setDoc(docRef, item, { merge: true });
      return item;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${item.id}`);
      throw err;
    }
  },

  // Delete document
  async deleteDocument(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    try {
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
      throw err;
    }
  },

  // Real-time listener for collection
  subscribeToCollection<T>(
    collectionName: string,
    onData: (items: T[]) => void,
    onError?: (error: any) => void
  ) {
    const collRef = collection(db, collectionName);
    return onSnapshot(
      collRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
        onData(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, collectionName);
      }
    );
  },

  // Seed initial dataset to Firestore if empty or missing
  async seedInitialDataIfEmpty(): Promise<boolean> {
    try {
      // 1. Settings
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
        if (!settingsSnap.exists()) {
          await setDoc(doc(db, 'settings', 'global'), INITIAL_SETTINGS);
        }
      } catch (e) {
        console.warn('Settings check/seed error:', e);
      }

      // 2. Branches
      const branchSnap = await getDocs(collection(db, 'branches'));
      if (branchSnap.empty) {
        for (const b of INITIAL_BRANCHES) {
          await setDoc(doc(db, 'branches', b.id), b);
        }
      }

      // 3. Projects
      const projSnap = await getDocs(collection(db, 'projects'));
      if (projSnap.empty) {
        for (const p of INITIAL_PROJECTS) {
          await setDoc(doc(db, 'projects', p.id), p);
        }
      }

      // 4. Locations
      const locSnap = await getDocs(collection(db, 'locations'));
      if (locSnap.empty) {
        for (const l of INITIAL_LOCATIONS) {
          await setDoc(doc(db, 'locations', l.id), l);
        }
      }

      // 5. Construction Costs
      const costSnap = await getDocs(collection(db, 'constructionCosts'));
      if (costSnap.empty) {
        for (const c of INITIAL_CONSTRUCTION) {
          await setDoc(doc(db, 'constructionCosts', c.id), c);
        }
      }

      // 6. Assets
      const assetSnap = await getDocs(collection(db, 'assets'));
      if (assetSnap.empty) {
        for (const a of INITIAL_ASSETS) {
          await setDoc(doc(db, 'assets', a.id), a);
        }
      }

      // 7. Inventory
      const invSnap = await getDocs(collection(db, 'inventory'));
      if (invSnap.empty) {
        for (const i of INITIAL_INVENTORY) {
          await setDoc(doc(db, 'inventory', i.id), i);
        }
      }

      // 8. Purchases
      const poSnap = await getDocs(collection(db, 'purchases'));
      if (poSnap.empty) {
        for (const p of INITIAL_PURCHASES) {
          await setDoc(doc(db, 'purchases', p.id), p);
        }
      }

      // 9. Suppliers
      const supSnap = await getDocs(collection(db, 'suppliers'));
      if (supSnap.empty) {
        for (const s of INITIAL_SUPPLIERS) {
          await setDoc(doc(db, 'suppliers', s.id), s);
        }
      }

      // 10. Expenses
      const expSnap = await getDocs(collection(db, 'expenses'));
      if (expSnap.empty) {
        for (const e of INITIAL_EXPENSES) {
          await setDoc(doc(db, 'expenses', e.id), e);
        }
      }

      // 11. Recipes
      const rcpSnap = await getDocs(collection(db, 'recipes'));
      if (rcpSnap.empty) {
        for (const r of INITIAL_RECIPES) {
          await setDoc(doc(db, 'recipes', r.id), r);
        }
      }

      // 12. Users
      const userSnap = await getDocs(collection(db, 'users'));
      if (userSnap.empty) {
        for (const u of INITIAL_USERS) {
          await setDoc(doc(db, 'users', u.id), u);
        }
      }

      return true;
    } catch (err) {
      console.warn('Initial Firestore seed attempt completed or skipped:', err);
      return false;
    }
  },

  // Reset Firestore to default demo data
  async resetDemoDataInFirestore(): Promise<void> {
    // Overwrite documents with initial data
    await setDoc(doc(db, 'settings', 'global'), INITIAL_SETTINGS);

    for (const b of INITIAL_BRANCHES) {
      await setDoc(doc(db, 'branches', b.id), b);
    }
    for (const p of INITIAL_PROJECTS) {
      await setDoc(doc(db, 'projects', p.id), p);
    }
    for (const l of INITIAL_LOCATIONS) {
      await setDoc(doc(db, 'locations', l.id), l);
    }
    for (const c of INITIAL_CONSTRUCTION) {
      await setDoc(doc(db, 'constructionCosts', c.id), c);
    }
    for (const a of INITIAL_ASSETS) {
      await setDoc(doc(db, 'assets', a.id), a);
    }
    for (const i of INITIAL_INVENTORY) {
      await setDoc(doc(db, 'inventory', i.id), i);
    }
    for (const po of INITIAL_PURCHASES) {
      await setDoc(doc(db, 'purchases', po.id), po);
    }
    for (const s of INITIAL_SUPPLIERS) {
      await setDoc(doc(db, 'suppliers', s.id), s);
    }
    for (const exp of INITIAL_EXPENSES) {
      await setDoc(doc(db, 'expenses', exp.id), exp);
    }
    for (const r of INITIAL_RECIPES) {
      await setDoc(doc(db, 'recipes', r.id), r);
    }
  }
};
