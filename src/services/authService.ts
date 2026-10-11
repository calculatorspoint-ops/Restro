import { initializeApp as initSecondaryApp, deleteApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  getAuth as getSecondaryAuth
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { auth, googleProvider, db, firebaseConfig } from '../firebase';
import { User, UserRole, isSuperManagerRole, AppPermissions } from '../types';
import {
  MASTER_ADMIN_EMAILS,
  MASTER_ADMIN_UIDS,
  isUserMasterAdmin,
  getEffectivePermissions,
  canModifyUser,
  canDeleteUser,
  canDeactivateUser
} from '../utils/authorization';

export interface AuthProfile extends User {
  emailVerified: boolean;
  photoURL?: string;
  updatedAt?: string;
}

// Convert technical Firebase Auth errors into friendly user-facing messages
export function mapAuthError(error: any): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password entered is incorrect. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long and contain numbers or symbols.';
    case 'auth/invalid-email':
      return 'Please enter a valid corporate or personal email address.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access temporarily restricted. Please wait or reset password.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by an administrator.';
    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please log in again before proceeding.';
    default:
      if (message.includes('offline') || message.includes('network')) {
        return 'Network error: could not connect to authentication services.';
      }
      return message.replace('Firebase: ', '') || 'Authentication failed. Please verify credentials.';
  }
}

export const authService = {
  // Initialize persistence to ensure session survives browser reloads & tabs
  async initPersistence() {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (err) {
      console.warn('Could not set browserLocalPersistence:', err);
    }
  },

  // Register new account with Firebase Auth & Firestore user doc
  async registerUser(
    fullName: string,
    email: string,
    password: string
  ): Promise<{ firebaseUser: FirebaseUser; profile: AuthProfile }> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = cred.user;

    // Update display name on Firebase Auth profile
    try {
      await updateProfile(fbUser, { displayName: fullName });
    } catch (e) {
      console.warn('Could not set displayName on Auth user:', e);
    }

    // Send verification email
    try {
      await sendEmailVerification(fbUser);
    } catch (e) {
      console.warn('Could not send verification email:', e);
    }

    // Determine initial role: primary enterprise owners are super_manager, manager is manager, others default to 'staff'
    const normalizedEmail = (email || '').trim().toLowerCase();
    const isOwner = normalizedEmail === 'muhammadkhurram682@gmail.com' || normalizedEmail === 'admin@restosetup.com';
    const isDefaultManager = normalizedEmail === 'manager@restosetup.com';
    const role: UserRole = isOwner ? 'super_manager' : (isDefaultManager ? 'manager' : 'staff');

    const profile: AuthProfile = {
      id: fbUser.uid,
      name: fullName,
      email: fbUser.email || email.trim(),
      role,
      assignedBranchIds: ['all'],
      phone: '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: fbUser.emailVerified,
      photoURL: fbUser.photoURL || undefined
    };

    // Store in Firestore users/{uid}
    const userDocRef = doc(db, 'users', fbUser.uid);
    await setDoc(userDocRef, profile, { merge: true });

    return { firebaseUser: fbUser, profile };
  },

  // Log in with Email and Password (Strict Firebase Authentication)
  async loginUser(
    email: string,
    password: string
  ): Promise<{ firebaseUser: FirebaseUser; profile: AuthProfile }> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = cred.user;
    const profile = await this.getOrCreateUserProfile(fbUser);
    return { firebaseUser: fbUser, profile };
  },

  // Log in with Google Popup
  async loginWithGoogle(): Promise<{ firebaseUser: FirebaseUser; profile: AuthProfile }> {
    const cred = await signInWithPopup(auth, googleProvider);
    const fbUser = cred.user;
    const profile = await this.getOrCreateUserProfile(fbUser);
    return { firebaseUser: fbUser, profile };
  },

  // Log out
  async logoutUser(): Promise<void> {
    await signOut(auth);
  },

  // Send Password Reset Email
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  },

  // Update password for currently authenticated user
  async updateCurrentUserPassword(newPassword: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No user is currently authenticated.');
    }
    await updatePassword(auth.currentUser, newPassword);
  },

  // Super Manager creates Manager / Staff / User account in Firebase Authentication backend
  // without terminating or disrupting the active Super Manager session
  async adminCreateFirebaseUser(
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ uid: string; email: string }> {
    const tempAppName = `SuperManagerCreate_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tempApp = initSecondaryApp(firebaseConfig, tempAppName);
    try {
      const tempAuth = getSecondaryAuth(tempApp);
      const cred = await createUserWithEmailAndPassword(tempAuth, email.trim(), password);
      const user = cred.user;

      if (displayName) {
        try {
          await updateProfile(user, { displayName });
        } catch (profileErr) {
          console.warn('Could not set displayName on created Firebase user:', profileErr);
        }
      }

      await signOut(tempAuth);
      return {
        uid: user.uid,
        email: user.email || email.trim()
      };
    } finally {
      try {
        await deleteApp(tempApp);
      } catch (delErr) {
        console.warn('Could not delete temporary secondary Firebase app:', delErr);
      }
    }
  },

  // Resend Email Verification
  async sendVerificationEmail(user?: FirebaseUser): Promise<void> {
    const target = user || auth.currentUser;
    if (!target) throw new Error('No active user logged in to send verification email.');
    await sendEmailVerification(target);
  },

  // Reload current user to check updated emailVerified status
  async reloadCurrentUser(): Promise<FirebaseUser | null> {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      return auth.currentUser;
    }
    return null;
  },

  // Fetch or create Firestore user profile doc for a Firebase User
  async getOrCreateUserProfile(fbUser: FirebaseUser): Promise<AuthProfile> {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const email = fbUser.email?.trim().toLowerCase() || '';
    const isMaster =
      MASTER_ADMIN_UIDS.includes(fbUser.uid) ||
      email === 'muhammadkhurram@gmail.com' ||
      email === 'muhammadkhurram682@gmail.com';
    const isOwner = isMaster || email === 'admin@restosetup.com';
    const isDefaultManager = email === 'manager@restosetup.com';

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        let role: UserRole = isMaster ? 'super_manager' : (data.role || (isOwner ? 'super_manager' : (isDefaultManager ? 'manager' : 'staff')));
        if (isOwner && !isSuperManagerRole(role)) {
          role = 'super_manager';
        } else if (isDefaultManager && role !== 'manager' && !isSuperManagerRole(role)) {
          role = 'manager';
        }

        const profile: AuthProfile = {
          id: fbUser.uid,
          name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || (isMaster ? 'Muhammad Khurram' : 'User'),
          email: fbUser.email || data.email || '',
          role,
          isMasterAdmin: isMaster ? true : (data.isMasterAdmin || false),
          assignedBranchIds: isMaster ? ['all'] : (data.assignedBranchIds || ['all']),
          phone: data.phone || fbUser.phoneNumber || '',
          status: isMaster ? 'active' : (data.status || 'active'),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerified: fbUser.emailVerified,
          photoURL: fbUser.photoURL || data.photoURL || undefined
        };
        // Update any refreshed fields (e.g. role upgrade, emailVerified, last login)
        await setDoc(userDocRef, profile, { merge: true });
        return profile;
      }
    } catch (err) {
      console.warn('Could not read user profile from Firestore:', err);
    }

    // If user profile doc does not exist yet at users/{fbUser.uid}, initialize a safe default profile.
    // SECURITY: Do not query by arbitrary unverified email or inherit elevated roles from untrusted docs.
    const initialRole: UserRole = isMaster || isOwner ? 'super_manager' : (isDefaultManager ? 'manager' : 'staff');

    const newProfile: AuthProfile = {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || (isMaster ? 'Muhammad Khurram' : 'Staff Member'),
      email: fbUser.email || '',
      role: initialRole,
      isMasterAdmin: isMaster ? true : false,
      assignedBranchIds: isMaster ? ['all'] : ['all'],
      phone: fbUser.phoneNumber || '',
      status: isMaster ? 'active' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: fbUser.emailVerified,
      photoURL: fbUser.photoURL || undefined
    };

    try {
      await setDoc(userDocRef, newProfile, { merge: true });
    } catch (err) {
      console.warn('Could not write initial user profile to Firestore:', err);
    }

    return newProfile;
  },

  // Update self profile details (Name, Phone, etc. - cannot change role)
  async updateProfileDetails(uid: string, updates: Partial<User>): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    // Protect role and status changes from client self-service
    const safeUpdates = { ...updates };
    delete safeUpdates.role;
    delete safeUpdates.status;
    delete safeUpdates.assignedBranchIds;
    safeUpdates.updatedAt = new Date().toISOString();

    await updateDoc(userDocRef, safeUpdates);

    if (auth.currentUser && updates.name) {
      try {
        await updateProfile(auth.currentUser, { displayName: updates.name });
      } catch (e) {
        console.warn('Could not update Auth displayName:', e);
      }
    }
  },

  // Super Manager administrative update for user accounts (assign roles, branches, toggle status)
  async updateUserAccessByAdmin(
    targetUserId: string,
    updates: {
      role?: UserRole;
      status?: 'active' | 'inactive';
      assignedBranchIds?: string[];
      name?: string;
      phone?: string;
    }
  ): Promise<void> {
    const userDocRef = doc(db, 'users', targetUserId);
    const targetSnap = await getDoc(userDocRef);
    if (targetSnap.exists()) {
      const data = targetSnap.data();
      // Primary owner cannot be demoted from Super Manager
      if (
        data.email?.toLowerCase() === 'muhammadkhurram682@gmail.com' &&
        updates.role &&
        !isSuperManagerRole(updates.role)
      ) {
        throw new Error('The primary owner cannot be demoted from Super Manager.');
      }
    }
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  // Delete User Account
  async deleteAccount(uid: string): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', uid);
      await deleteDoc(userDocRef);
    } catch (e) {
      console.warn('Could not delete user Firestore doc:', e);
    }

    if (auth.currentUser && auth.currentUser.uid === uid) {
      await auth.currentUser.delete();
    }
  },

  // Auth State Listener
  subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};
