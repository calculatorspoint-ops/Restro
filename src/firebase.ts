import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableNetwork,
  disableNetwork,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import defaultConfig from '../firebase-applet-config.json';

// Support Vercel / Production Environment variables with fallback to config file
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {}) as any;

const targetProjectId = env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId;

// Resolve Database ID carefully:
// 1. Check any explicit environment variable override
const rawDbEnv = env.VITE_FIREBASE_DATABASE_ID || env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || env.VITE_FIRESTORE_DATABASE_ID;

let resolvedDatabaseId: string | undefined = undefined;

if (rawDbEnv !== undefined && rawDbEnv !== null && rawDbEnv !== '') {
  const trimmed = String(rawDbEnv).trim();
  if (trimmed === '(default)' || trimmed === 'default') {
    resolvedDatabaseId = undefined; // Firebase SDK connects to standard default database when undefined/omitted
  } else {
    resolvedDatabaseId = trimmed;
  }
} else {
  // If no database ID is explicitly specified in env:
  // If the projectId is the applet's provisioned project, use the applet's provisioned named database ID
  if (targetProjectId === defaultConfig.projectId && defaultConfig.firestoreDatabaseId && defaultConfig.firestoreDatabaseId !== '(default)') {
    resolvedDatabaseId = defaultConfig.firestoreDatabaseId;
  } else {
    // If deploying to a different custom Firebase project on Vercel, the default database is standard
    resolvedDatabaseId = undefined;
  }
}

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: targetProjectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || defaultConfig.appId,
  ...(resolvedDatabaseId ? { firestoreDatabaseId: resolvedDatabaseId } : {}),
  ...(env.VITE_FIREBASE_MEASUREMENT_ID ? { measurementId: env.VITE_FIREBASE_MEASUREMENT_ID } : {}),
};

// Fail clearly if configuration is missing rather than silently switching to broken state
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const errMsg = '[Firebase] Critical: Missing required Firebase configuration (apiKey/projectId). Please verify Vercel environment variables or firebase-applet-config.json.';
  console.error(errMsg);
  throw new Error(errMsg);
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/* CRITICAL: Enable Firestore offline persistent cache for instant loading across reloads with multi-stage fallback */
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    },
    resolvedDatabaseId
  );
} catch (error) {
  console.warn('[Firebase] Multi-tab persistent cache initialization fallback:', error);
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({})
      },
      resolvedDatabaseId
    );
  } catch (error2) {
    console.warn('[Firebase] Single-tab persistent cache fallback to getFirestore:', error2);
    firestoreInstance = resolvedDatabaseId ? getFirestore(app, resolvedDatabaseId) : getFirestore(app);
  }
}

export const db = firestoreInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { enableNetwork, disableNetwork };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  SUBSCRIBE = 'subscribe'
}

export interface FirestoreErrorInfo {
  code?: string;
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isFirestoreNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  const code = (err as any)?.code || '';
  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('network') ||
    msg.includes('client is offline') ||
    msg.includes('failed to fetch')
  );
}

export function logFirestoreDiagnosticError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  context?: { role?: string; branchScope?: string | string[] | readonly string[] }
) {
  const fbErr = error as any;
  const code = fbErr?.code || (error instanceof Error ? error.name : 'UNKNOWN');
  const message = error instanceof Error ? error.message : String(error);

  console.error('[Firestore Diagnostic]', {
    operationType,
    collectionOrPath: path,
    code,
    message,
    userId: auth.currentUser?.uid || 'unauthenticated',
    userRole: context?.role || 'unknown',
    branchScope: context?.branchScope || 'global',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    timestamp: new Date().toISOString()
  });
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  shouldThrow = true
) {
  const fbErr = error as any;
  const errInfo: FirestoreErrorInfo = {
    code: fbErr?.code,
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Force Firestore client to reconnect network channel and test probe
export async function forceFirestoreReconnect(): Promise<boolean> {
  try {
    await enableNetwork(db);
    const probe = await testFirestoreConnection(3500);
    return probe.ok;
  } catch (e) {
    console.warn('[Firebase] forceFirestoreReconnect warning:', e);
    return false;
  }
}

export interface ConnectionTestResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

// Authoritative Cloud Firestore backend connectivity probe
export async function testFirestoreConnection(timeoutMs = 4000): Promise<ConnectionTestResult> {
  const start = performance.now();
  try {
    const probePromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection probe timed out')), timeoutMs)
    );
    await Promise.race([probePromise, timeoutPromise]);
    const latencyMs = Math.round(performance.now() - start);
    return { ok: true, latencyMs };
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: msg };
  }
}
