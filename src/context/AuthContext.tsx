import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { User, UserRole, isSuperManagerRole, isManagerRole, isStaffRole } from '../types';
import { authService, AuthProfile, mapAuthError } from '../services/authService';
import { MASTER_ADMIN_UIDS } from '../utils/authorization';
import { auth, db } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: AuthProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changeCurrentUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  updateProfileDetails: (updates: Partial<User>) => Promise<boolean>;
  deleteUserAccount: () => Promise<boolean>;
  switchUserRole: (role: UserRole) => void;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canDeleteBranches: boolean;
  canDeleteProjects: boolean;
  canManageBranches: boolean;
  canManageProjects: boolean;
  canDeleteRecords: boolean;
  canEditBranch: (branchId?: string) => boolean;
  isSuperManager: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isMasterAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Initialize persistence on boot
  useEffect(() => {
    authService.initPersistence();
  }, []);

  // Listen to authoritative Firebase Auth changes
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const profile = await authService.getOrCreateUserProfile(fbUser);
          setCurrentUser(profile);
        } catch (err) {
          console.warn('Error syncing profile from Firestore:', err);
          const isOwner = fbUser.email?.toLowerCase() === 'muhammadkhurram682@gmail.com';
          setCurrentUser({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: isOwner ? 'super_admin' : 'admin',
            assignedBranchIds: ['all'],
            phone: '',
            status: 'active',
            createdAt: new Date().toISOString(),
            emailVerified: fbUser.emailVerified
          });
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login handler
  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    try {
      const { profile } = await authService.loginUser(email, password);
      setCurrentUser(profile);
      return { success: true };
    } catch (err: any) {
      const friendlyMsg = mapAuthError(err);
      return { success: false, error: friendlyMsg };
    }
  };

  // Register handler
  const register = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { profile } = await authService.registerUser(fullName, email, password);
      setCurrentUser(profile);
      return { success: true };
    } catch (err: any) {
      const friendlyMsg = mapAuthError(err);
      return { success: false, error: friendlyMsg };
    }
  };

  // Google Login handler
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { profile } = await authService.loginWithGoogle();
      setCurrentUser(profile);
      return { success: true };
    } catch (err: any) {
      const friendlyMsg = mapAuthError(err);
      return { success: false, error: friendlyMsg };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authService.logoutUser();
    } catch (err) {
      console.warn('Error signing out:', err);
    }
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  // Password reset
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.sendPasswordReset(email);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  // Change current user password
  const changeCurrentUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.updateCurrentUserPassword(newPassword);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  // Resend email verification
  const resendVerification = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.sendVerificationEmail();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  // Reload user state
  const refreshUser = async () => {
    const refreshed = await authService.reloadCurrentUser();
    if (refreshed) {
      setFirebaseUser(refreshed);
      const profile = await authService.getOrCreateUserProfile(refreshed);
      setCurrentUser(profile);
    }
  };

  // Update profile
  const updateProfileDetails = async (updates: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      await authService.updateProfileDetails(currentUser.id, updates);
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
      return true;
    } catch (err) {
      console.error('Failed to update profile:', err);
      return false;
    }
  };

  // Delete account
  const deleteUserAccount = async (): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      await authService.deleteAccount(currentUser.id);
      setCurrentUser(null);
      setFirebaseUser(null);
      return true;
    } catch (err) {
      console.error('Failed to delete account:', err);
      return false;
    }
  };

  // Testing role switch: updates state and syncs to Firestore profile (Super Managers only)
  const switchUserRole = async (role: UserRole) => {
    if (!currentUser) return;
    const callerIsSuper =
      currentUser.isMasterAdmin === true ||
      isSuperManagerRole(currentUser.role) ||
      ['muhammadkhurram@gmail.com', 'muhammadkhurram682@gmail.com'].includes(currentUser.email?.toLowerCase().trim() || '');

    if (!callerIsSuper) {
      console.warn('Unauthorized role switch attempt rejected.');
      return;
    }

    setCurrentUser((prev) => (prev ? { ...prev, role } : null));

    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, { role, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Could not persist simulated role to Firestore doc:', err);
      }
    }
  };

  // Permissions & Roles Resolution
  const isMasterAdmin =
    currentUser?.isMasterAdmin === true ||
    (!!currentUser?.id && MASTER_ADMIN_UIDS.includes(currentUser.id)) ||
    (!!firebaseUser?.uid && MASTER_ADMIN_UIDS.includes(firebaseUser.uid)) ||
    currentUser?.email?.toLowerCase().trim() === 'muhammadkhurram@gmail.com' ||
    currentUser?.email?.toLowerCase().trim() === 'muhammadkhurram682@gmail.com' ||
    firebaseUser?.email?.toLowerCase().trim() === 'muhammadkhurram@gmail.com' ||
    firebaseUser?.email?.toLowerCase().trim() === 'muhammadkhurram682@gmail.com';

  const isOwnerEmail =
    isMasterAdmin ||
    currentUser?.email?.toLowerCase() === 'admin@restosetup.com';
  const isManagerEmail = currentUser?.email?.toLowerCase() === 'manager@restosetup.com';

  const isSuperManager =
    isMasterAdmin ||
    isSuperManagerRole(currentUser?.role) ||
    (isOwnerEmail && currentUser?.role !== 'staff' && currentUser?.role !== 'manager');
  const isManager =
    isManagerRole(currentUser?.role) ||
    isSuperManager ||
    (isManagerEmail && currentUser?.role !== 'staff');
  const isStaff = isStaffRole(currentUser?.role) && !isSuperManager && !isManager;

  // Compatibility aliases
  const isSuperAdmin = isSuperManager;
  const isAdmin = isManager;

  // Granular capability flags strictly matching the enterprise role hierarchy
  const canManageUsers = isSuperManager;
  const canManageSettings = isSuperManager;
  const canDeleteBranches = isSuperManager;
  const canDeleteProjects = isSuperManager;

  const canManageBranches = isManager;
  const canManageProjects = isManager;
  const canDeleteRecords = isManager; // Staff CANNOT delete records

  const canEditBranch = useCallback((branchId?: string) => {
    if (!currentUser) return false;
    if (isSuperManager) return true;
    if (!isManager) return false; // Staff cannot edit branch configs
    if (!branchId) return true;
    if (currentUser.assignedBranchIds?.includes('all')) return true;
    return currentUser.assignedBranchIds?.includes(branchId) || false;
  }, [currentUser, isSuperManager, isManager]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAuthenticated: !!firebaseUser && !!currentUser,
        authLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        changeCurrentUserPassword,
        resendVerification,
        refreshUser,
        updateProfileDetails,
        deleteUserAccount,
        switchUserRole,
        canManageUsers,
        canManageSettings,
        canDeleteBranches,
        canDeleteProjects,
        canManageBranches,
        canManageProjects,
        canDeleteRecords,
        canEditBranch,
        isSuperManager,
        isManager,
        isSuperAdmin,
        isAdmin,
        isStaff,
        isMasterAdmin
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
