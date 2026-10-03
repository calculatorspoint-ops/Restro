import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  switchUserRole: (role: UserRole) => void;
  canManageUsers: boolean;
  canManageBranches: boolean;
  canDeleteRecords: boolean;
  canEditBranch: (branchId?: string) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, User> = {
  super_admin: {
    id: "usr-superadmin",
    name: "Muhammad Khurram (Director Operations)",
    email: "admin@restosetup.com",
    role: "super_admin",
    assignedBranchIds: ["all"],
    phone: "+92 300 1234567",
    status: "active",
    createdAt: "2026-01-10T10:00:00.000Z"
  },
  admin: {
    id: "usr-manager1",
    name: "Tariq Mehmood (Project Manager)",
    email: "manager@restosetup.com",
    role: "admin",
    assignedBranchIds: ["br-khi-01", "br-lhr-02"],
    phone: "+92 321 9876543",
    status: "active",
    createdAt: "2026-01-15T11:00:00.000Z"
  },
  staff: {
    id: "usr-staff1",
    name: "Bilal Ahmed (Site Inventory Supervisor)",
    email: "staff@restosetup.com",
    role: "staff",
    assignedBranchIds: ["br-khi-01"],
    phone: "+92 333 4567890",
    status: "active",
    createdAt: "2026-02-01T09:30:00.000Z"
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('restosetup_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_USERS.super_admin;
      }
    }
    return DEMO_USERS.super_admin;
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthLoading(false);

      if (fbUser) {
        const isOwner = fbUser.email?.toLowerCase() === 'muhammadkhurram682@gmail.com';
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const existing = snap.data() as User;
            const role = isOwner ? 'super_admin' : (existing.role || 'admin');
            const updatedUser: User = {
              ...existing,
              id: fbUser.uid,
              email: fbUser.email || existing.email,
              name: existing.name || fbUser.displayName || 'Authenticated User',
              role
            };
            await setDoc(userDocRef, updatedUser, { merge: true });
            setCurrentUser(updatedUser);
          } else {
            const newUser: User = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Authenticated User',
              email: fbUser.email || '',
              role: isOwner ? 'super_admin' : 'admin',
              assignedBranchIds: ['all'],
              phone: fbUser.phoneNumber || '',
              status: 'active',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newUser, { merge: true });
            setCurrentUser(newUser);
          }
        } catch (err) {
          console.warn('Sync user document in Firestore:', err);
          const fallbackUser: User = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Authenticated User',
            email: fbUser.email || '',
            role: isOwner ? 'super_admin' : 'admin',
            assignedBranchIds: ['all'],
            phone: fbUser.phoneNumber || '',
            status: 'active',
            createdAt: new Date().toISOString()
          };
          setCurrentUser(fallbackUser);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('restosetup_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('restosetup_auth_user');
    }
  }, [currentUser]);

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        return true;
      }
    } catch (err) {
      console.warn('Google sign in error or popup closed:', err);
    }
    return false;
  };

  const login = async (email: string, password = ''): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        return true;
      }
    } catch {
      // Fallback matching demo credentials
      const match = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (match) {
        setCurrentUser(match);
        return true;
      }
    }
    return false;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign out error:', err);
    }
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const switchUserRole = (role: UserRole) => {
    setCurrentUser(DEMO_USERS[role] || DEMO_USERS.super_admin);
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';

  const canManageUsers = isSuperAdmin;
  const canManageBranches = isSuperAdmin;
  const canDeleteRecords = isSuperAdmin || isAdmin;

  const canEditBranch = (branchId?: string) => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    if (!branchId) return true;
    if (currentUser.assignedBranchIds.includes('all')) return true;
    return currentUser.assignedBranchIds.includes(branchId);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAuthenticated: !!currentUser,
        authLoading,
        login,
        loginWithGoogle,
        logout,
        switchUserRole,
        canManageUsers,
        canManageBranches,
        canDeleteRecords,
        canEditBranch,
        isSuperAdmin,
        isAdmin,
        isStaff
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
