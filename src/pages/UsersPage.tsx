import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  User as UserIcon,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Building,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Eye,
  Sliders,
  RotateCcw,
  Check,
  X,
  FileText,
  KeyRound,
  Users,
  Shield,
  Layers,
  MapPin,
  History,
  Download,
  Filter,
  EyeOff,
  Sparkles,
  Copy
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  User,
  UserRole,
  getRoleDisplayName,
  isSuperManagerRole,
  isManagerRole,
  isStaffRole,
  AppPermissions,
  PermissionModuleName
} from '../types';
import {
  isUserMasterAdmin,
  normalizeCanonicalRole,
  getRoleDefaultPermissions,
  getEffectivePermissions,
  getRoleDefaultAccessList,
  getRoleRestrictedAccessList,
  canModifyUser,
  canDeleteUser,
  canDeactivateUser,
  CanonicalRole
} from '../utils/authorization';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { formatDate } from '../utils/formatters';

type ActiveTab = 'users' | 'roles' | 'permissions' | 'branch_access' | 'audit';

const MODULE_DEFINITIONS: Record<
  PermissionModuleName,
  { label: string; actions: Array<{ key: string; label: string }> }
> = {
  dashboard: {
    label: 'Executive Dashboard',
    actions: [{ key: 'view', label: 'View Dashboard' }]
  },
  branches: {
    label: 'Restaurant Branches',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  projects: {
    label: 'Fit-Out Setup Projects',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  construction: {
    label: 'Construction & Civil Costing',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  assets: {
    label: 'Equipment & Asset Register',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  inventory: {
    label: 'Inventory & Stock SKUs',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  purchases: {
    label: 'Purchase Orders & Invoices',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
      { key: 'approve', label: 'Approve Orders' }
    ]
  },
  suppliers: {
    label: 'Suppliers & Contractors',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  expenses: {
    label: 'Operational Expense Vouchers',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  recipes: {
    label: 'Recipes & COGS Costing',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  locations: {
    label: 'Locations & Room Areas',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  handover: {
    label: 'Handover & Sign-Offs',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  documents: {
    label: 'Branded Documents & PDF',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  reports: {
    label: 'Executive Reports & Analytics',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'export', label: 'Export Data' }
    ]
  },
  excel: {
    label: 'Excel Center (Import / Export)',
    actions: [
      { key: 'import', label: 'Import' },
      { key: 'export', label: 'Export' }
    ]
  },
  audit: {
    label: 'System Audit Logs',
    actions: [{ key: 'view', label: 'View Audit Logs' }]
  },
  users: {
    label: 'Users, Roles & Access Control',
    actions: [
      { key: 'view', label: 'View Users' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
      { key: 'manage_roles', label: 'Manage Roles' },
      { key: 'manage_permissions', label: 'Manage Permissions' }
    ]
  },
  settings: {
    label: 'Organizational & Fiscal Settings',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'edit', label: 'Edit Settings' }
    ]
  }
};

export const UsersPage: React.FC = () => {
  const { users, branches, auditLogs, saveUser, deleteUser, changeUserPassword } = useData();
  const { currentUser, isSuperManager, isMasterAdmin: authIsMaster, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [userPassword, setUserPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCustomPermissions, setShowCustomPermissions] = useState(false);
  const [customOverrides, setCustomOverrides] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedBranchesMode, setSelectedBranchesMode] = useState<'all' | 'custom'>('all');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [createInFirebaseAuth, setCreateInFirebaseAuth] = useState(true);
  const [sendWelcomeResetEmail, setSendWelcomeResetEmail] = useState(false);
  const [requirePasswordChangeOnFirstLogin, setRequirePasswordChangeOnFirstLogin] = useState(false);
  const [copiedCreatePassword, setCopiedCreatePassword] = useState(false);
  const [createdSuccessBanner, setCreatedSuccessBanner] = useState<{
    name: string;
    role: string;
    email: string;
    synced: boolean;
  } | null>(null);

  // Permissions View Modal
  const [viewPermissionsUser, setViewPermissionsUser] = useState<User | null>(null);

  // Delete Modal state
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);

  // Change Password Modal state
  const [changePasswordModalUser, setChangePasswordModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mustChangeOnLogin, setMustChangeOnLogin] = useState(false);
  const [sendResetEmailCheckbox, setSendResetEmailCheckbox] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [passwordModalSuccess, setPasswordModalSuccess] = useState<string | null>(null);
  const [isSendingDirectResetEmail, setIsSendingDirectResetEmail] = useState(false);
  const [copiedGenerated, setCopiedGenerated] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Current user's master admin check
  const isCurrentUserMaster = authIsMaster || isUserMasterAdmin(currentUser);

  // Password Management Handlers
  const handleOpenChangePassword = (targetUser: User) => {
    setChangePasswordModalUser(targetUser);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setMustChangeOnLogin(false);
    setSendResetEmailCheckbox(false);
    setPasswordModalError(null);
    setPasswordModalSuccess(null);
    setCopiedGenerated(false);
  };

  const handleCloseChangePasswordModal = () => {
    if (isChangingPassword) return;
    setChangePasswordModalUser(null);
    setPasswordModalError(null);
    setPasswordModalSuccess(null);
  };

  const generateStrongPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%&*';
    const all = upper + lower + digits + symbols;
    let pwd = '';
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < 12; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    const shuffled = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    setNewPassword(shuffled);
    setConfirmPassword(shuffled);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
  };

  const copyPasswordToClipboard = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopiedGenerated(true);
      setTimeout(() => setCopiedGenerated(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
    if (score <= 4) return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  }, [newPassword]);

  const handleSavePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordModalUser) return;

    if (newPassword.length < 6) {
      setPasswordModalError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordModalError('New password and confirm password do not match.');
      return;
    }

    if (isUserMasterAdmin(changePasswordModalUser) && !isCurrentUserMaster) {
      setPasswordModalError('Protected Account: Only the Master Admin has permission to modify the Master Admin credentials.');
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordModalError(null);

      await changeUserPassword(changePasswordModalUser.id, newPassword, {
        sendResetEmail: sendResetEmailCheckbox,
        mustChangePassword: mustChangeOnLogin
      });

      setPasswordModalSuccess(`Password successfully changed for ${changePasswordModalUser.name}.`);
      setTimeout(() => {
        handleCloseChangePasswordModal();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setPasswordModalError(err?.message || 'Failed to change user password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendDirectResetEmail = async () => {
    if (!changePasswordModalUser?.email) return;
    try {
      setIsSendingDirectResetEmail(true);
      setPasswordModalError(null);
      const res = await resetPassword(changePasswordModalUser.email);
      if (res.success) {
        setPasswordModalSuccess(`Password reset email successfully sent to ${changePasswordModalUser.email}.`);
      } else {
        setPasswordModalError(res.error || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      setPasswordModalError(err?.message || 'Failed to send password reset email.');
    } finally {
      setIsSendingDirectResetEmail(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!u) return false;
      const term = (searchTerm || '').toLowerCase();
      const matchesSearch =
        !term ||
        String(u.name || '').toLowerCase().includes(term) ||
        String(u.email || '').toLowerCase().includes(term) ||
        String(u.role || '').toLowerCase().includes(term) ||
        String(u.phone || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // Role filter
      if (roleFilter !== 'all') {
        const isMaster = isUserMasterAdmin(u);
        if (roleFilter === 'master' && !isMaster) return false;
        if (roleFilter === 'super_manager' && (isMaster || !isSuperManagerRole(u.role))) return false;
        if (roleFilter === 'manager' && (!isManagerRole(u.role) || isSuperManagerRole(u.role))) return false;
        if (roleFilter === 'staff' && !isStaffRole(u.role)) return false;
      }

      // Branch filter
      if (branchFilter !== 'all') {
        if (!u.assignedBranchIds?.includes('all') && !u.assignedBranchIds?.includes(branchFilter)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (u.status !== statusFilter) return false;
      }

      return true;
    });
  }, [users, searchTerm, roleFilter, branchFilter, statusFilter]);

  // Handle Open Create
  const handleOpenCreate = () => {
    setEditingUser({
      name: '',
      email: '',
      role: 'manager',
      assignedBranchIds: ['all'],
      phone: '+92 ',
      status: 'active'
    });
    setUserPassword('');
    setShowCreatePassword(false);
    setCreateInFirebaseAuth(true);
    setSendWelcomeResetEmail(false);
    setRequirePasswordChangeOnFirstLogin(false);
    setCopiedCreatePassword(false);
    setShowCustomPermissions(false);
    setCustomOverrides({});
    setSelectedBranchesMode('all');
    setSelectedBranchIds([]);
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleGenerateCreatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = 'Spice@';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserPassword(generated);
    setShowCreatePassword(true);
  };

  const handleCopyCreatePassword = () => {
    if (!userPassword) return;
    navigator.clipboard?.writeText(userPassword);
    setCopiedCreatePassword(true);
    setTimeout(() => setCopiedCreatePassword(false), 2000);
  };

  // Handle Open Edit
  const handleOpenEdit = (user: User) => {
    const isMaster = isUserMasterAdmin(user);
    setEditingUser({ ...user });
    setUserPassword('');
    setShowCustomPermissions(Object.keys(user.customPermissionOverrides || {}).length > 0);
    setCustomOverrides(user.customPermissionOverrides ? JSON.parse(JSON.stringify(user.customPermissionOverrides)) : {});

    if (isMaster || user.assignedBranchIds?.includes('all')) {
      setSelectedBranchesMode('all');
      setSelectedBranchIds([]);
    } else {
      setSelectedBranchesMode('custom');
      setSelectedBranchIds([...(user.assignedBranchIds || [])]);
    }

    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingUser(null);
    setSubmitError(null);
  };

  // Current editing canonical role
  const editingRole: CanonicalRole = useMemo(() => {
    if (!editingUser) return 'manager';
    if (isUserMasterAdmin(editingUser)) return 'super_manager';
    return normalizeCanonicalRole(editingUser.role, editingUser.email);
  }, [editingUser]);

  // Selected role default permissions
  const selectedRoleDefaults = useMemo(() => {
    return getRoleDefaultPermissions(editingRole);
  }, [editingRole]);

  // Selected role default access lists
  const defaultAccessList = useMemo(() => {
    return getRoleDefaultAccessList(editingRole);
  }, [editingRole]);

  const defaultRestrictedList = useMemo(() => {
    return getRoleRestrictedAccessList(editingRole);
  }, [editingRole]);

  // Handle changing custom permission override
  const handleTogglePermissionOverride = (mod: string, act: string) => {
    setCustomOverrides((prev) => {
      const copy = { ...prev };
      const modCopy = copy[mod] ? { ...copy[mod] } : {};
      const currentVal = modCopy[act] !== undefined ? modCopy[act] : (selectedRoleDefaults[mod as PermissionModuleName] as any)?.[act] || false;
      modCopy[act] = !currentVal;
      copy[mod] = modCopy;
      return copy;
    });
  };

  // Handle reset to role defaults
  const handleResetToRoleDefaults = () => {
    setCustomOverrides({});
  };

  // Handle Toggle Branch in selected mode
  const handleToggleBranch = (branchId: string) => {
    setSelectedBranchIds((prev) => {
      if (prev.includes(branchId)) {
        return prev.filter((id) => id !== branchId);
      } else {
        return [...prev, branchId];
      }
    });
  };

  // Handle Save User
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name || !editingUser.email || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const isMaster = isUserMasterAdmin(editingUser);

      // Determine assigned branches
      let assignedBranchIds: string[] = ['all'];
      if (!isMaster) {
        if (selectedBranchesMode === 'all') {
          assignedBranchIds = ['all'];
        } else {
          assignedBranchIds = selectedBranchIds.length > 0 ? selectedBranchIds : ['all'];
        }
      }

      // Clean overrides: remove any that match default
      const cleanedOverrides: Record<string, Record<string, boolean>> = {};
      Object.keys(customOverrides).forEach((mod) => {
        const modKey = mod as PermissionModuleName;
        const modDefs = selectedRoleDefaults[modKey] as any;
        Object.keys(customOverrides[mod]).forEach((act) => {
          const val = customOverrides[mod][act];
          if (modDefs && modDefs[act] !== val) {
            if (!cleanedOverrides[mod]) cleanedOverrides[mod] = {};
            cleanedOverrides[mod][act] = val;
          }
        });
      });

      const userPayload: Partial<User> = {
        ...editingUser,
        role: isMaster ? 'super_manager' : (editingUser.role || 'manager'),
        isMasterAdmin: isMaster ? true : (editingUser.isMasterAdmin || false),
        status: isMaster ? 'active' : (editingUser.status || 'active'),
        assignedBranchIds,
        customPermissionOverrides: Object.keys(cleanedOverrides).length > 0 ? cleanedOverrides : undefined
      };

      if (!editingUser.id) {
        if (createInFirebaseAuth) {
          if (!userPassword || userPassword.length < 6) {
            setSubmitError('Firebase Authentication requires an initial password with at least 6 characters.');
            setIsSubmitting(false);
            return;
          }
        }
        if (userPassword) {
          userPayload.password = userPassword;
          userPayload.passwordLastChangedAt = new Date().toISOString();
        }
        userPayload.mustChangePassword = requirePasswordChangeOnFirstLogin;
      }

      await saveUser(userPayload, {
        createInFirebaseAuth,
        password: userPassword,
        sendWelcomeEmail: sendWelcomeResetEmail,
        mustChangePassword: requirePasswordChangeOnFirstLogin
      });

      setCreatedSuccessBanner({
        name: userPayload.name || 'User',
        role: getRoleDisplayName(userPayload.role, isMaster),
        email: userPayload.email || '',
        synced: createInFirebaseAuth
      });
      setTimeout(() => {
        setCreatedSuccessBanner(null);
      }, 7000);

      setIsFormOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      console.error('Failed to save user:', err);
      const rawMsg = err?.message || String(err || '');
      if (rawMsg.includes('Missing or insufficient permissions') || rawMsg.includes('permission-denied')) {
        setSubmitError('Permission Denied: Only authorized Super Managers have authority to modify user records.');
      } else {
        setSubmitError(rawMsg && rawMsg.length < 160 ? rawMsg : 'Failed to save user account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user status (Activate / Deactivate)
  const handleToggleStatus = async (user: User) => {
    if (isUserMasterAdmin(user)) return;
    if (user.id === currentUser?.id) return;
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await saveUser({
        ...user,
        status: newStatus
      });
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // If non-super-manager navigates directly
  if (!isSuperManager) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          Centralized User Administration, Role Definitions, and Branch Access Scopes are strictly reserved for <strong>Super Managers</strong> and the <strong>Master Super Admin</strong>.
        </p>
        <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-500 max-w-sm mx-auto border border-slate-200">
          Current Role: <span className="text-blue-600 font-bold">{getRoleDisplayName(currentUser?.role, authIsMaster)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-base font-bold text-slate-900">
              Users, Roles & Access Management
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              Central Access Control
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Single control center for the <strong>Master Admin</strong> to manage users, assign canonical roles, preview and customize permissions, and enforce branch access scopes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2 shrink-0 shadow-xs cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Success Notification Banner for Created User */}
      {createdSuccessBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center justify-between text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <span>User Account Created Successfully</span>
                {createdSuccessBanner.synced && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold">
                    Firebase Auth Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                <strong>{createdSuccessBanner.name}</strong> ({createdSuccessBanner.role}) has been saved and registered in the <strong>Firebase Authentication backend</strong> ({createdSuccessBanner.email}). The user can sign in immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreatedSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1.5 rounded-md hover:bg-emerald-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-lg px-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users Directory</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Role Hierarchy</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'permissions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>18-Module Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('branch_access')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'branch_access'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Branch Scopes</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
            {branches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit History</span>
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, email, role, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="master">Master Super Admin</option>
                <option value="super_manager">Super Manager</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">User Identity</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role & Authority</th>
                    <th className="py-3 px-4">Branch Access</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No users match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isMaster = isUserMasterAdmin(u);
                      const isSuper = isSuperManagerRole(u.role);
                      const isMgr = isManagerRole(u.role) && !isSuper;
                      const roleDisplay = getRoleDisplayName(u.role, isMaster);

                      const isAll = isMaster || u.assignedBranchIds?.includes('all');
                      const assignedNames = isAll
                        ? 'All Branches (Global)'
                        : u.assignedBranchIds
                            ?.map((id) => branches.find((b) => b.id === id)?.code || id)
                            .join(', ') || 'No branch assigned';

                      const hasOverrides = u.customPermissionOverrides && Object.keys(u.customPermissionOverrides).length > 0;

                      return (
                        <tr
                          key={u.id}
                          className={`transition-colors ${
                            isMaster ? 'bg-purple-50/30 hover:bg-purple-50/60' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Identity */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isMaster
                                    ? 'bg-purple-700 text-white shadow-xs'
                                    : isSuper
                                    ? 'bg-purple-100 text-purple-700'
                                    : isMgr
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {(u.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-900">{u.name}</span>
                                  {isMaster && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-purple-100 text-purple-800 border border-purple-200 font-bold flex items-center gap-0.5">
                                      <Lock className="w-2.5 h-2.5" />
                                      Master Admin
                                    </span>
                                  )}
                                  {hasOverrides && !isMaster && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-amber-50 text-amber-700 border border-amber-200 font-semibold" title="Custom permission overrides active">
                                      Customized
                                    </span>
                                  )}
                                  {u.firebaseAuthSynced && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-0.5" title="Credentials registered in Firebase Authentication backend">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                      Firebase Auth
                                    </span>
                                  )}
                                  {u.mustChangePassword && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-amber-50 text-amber-700 border border-amber-200 font-semibold" title="Password change requested on next sign-in">
                                      Reset Req.
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 block">{u.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 font-mono text-slate-700">{u.email}</td>

                          {/* Role */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-sm border inline-flex items-center gap-1 ${
                                isMaster
                                  ? 'text-purple-800 bg-purple-50 border-purple-300 font-bold'
                                  : isSuper
                                  ? 'text-purple-700 bg-purple-50 border-purple-200'
                                  : isMgr
                                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                                  : 'text-slate-700 bg-slate-100 border-slate-200'
                              }`}
                            >
                              {isMaster ? (
                                <ShieldCheck className="w-3 h-3 text-purple-700" />
                              ) : isSuper ? (
                                <ShieldCheck className="w-3 h-3 text-purple-600" />
                              ) : isMgr ? (
                                <UserIcon className="w-3 h-3 text-blue-600" />
                              ) : null}
                              {roleDisplay}
                            </span>
                          </td>

                          {/* Branch Scope */}
                          <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                            <span className={isAll ? 'font-medium text-slate-800' : ''}>
                              {assignedNames}
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                            {u.phone || '-'}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              disabled={isMaster || u.id === currentUser?.id}
                              onClick={() => handleToggleStatus(u)}
                              title={
                                isMaster
                                  ? 'Master Admin is permanently active'
                                  : u.id === currentUser?.id
                                  ? 'Cannot toggle self account'
                                  : 'Click to toggle active / inactive status'
                              }
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                                u.status === 'active'
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                  : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200'
                              } ${isMaster || u.id === currentUser?.id ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                            >
                              {u.status}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* View Permissions */}
                              <button
                                onClick={() => setViewPermissionsUser(u)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="View Permissions Breakdown"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit User */}
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Edit User Credentials & Access"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Change Password */}
                              <button
                                onClick={() => handleOpenChangePassword(u)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                title="Change User Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete User */}
                              {!isMaster && u.id !== currentUser?.id && (
                                <button
                                  onClick={() => setDeleteModalUser(u)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                  title="Delete User Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & HIERARCHY ARCHITECTURE */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Master Super Admin Card */}
            <div className="p-5 bg-white rounded-lg border-2 border-purple-200 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-bl-md">
                PERMANENT OWNER
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-purple-50 text-purple-700 rounded-md">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Master Super Admin</h3>
                  <span className="text-[11px] font-mono text-purple-700">muhammadkhurram@gmail.com</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                The permanent, unalterable Master Admin account with total, universal ERP privilege across every module, branch, and administrative system setting.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Unrestricted ERP & financial authority</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Universal global branch access (all branches)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Manage users, assign roles & customize overrides</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-700 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Protected account: cannot be demoted or deleted</span>
                </div>
              </div>
            </div>

            {/* Manager Card */}
            <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-blue-50 text-blue-700 rounded-md">
                  <UserIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manager</h3>
                  <span className="text-[11px] font-mono text-blue-700">Operational Level 2</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Manages day-to-day operations across assigned branches: projects, physical assets, raw inventory, PO approvals, recipes, and expense vouchers.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Manage branches & fit-out projects</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve purchase orders & manage inventory</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Formulate recipes, COGS & view reports</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600">
                  <X className="w-3.5 h-3.5" />
                  <span>Restricted from deleting branches or projects</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600">
                  <X className="w-3.5 h-3.5" />
                  <span>Restricted from managing users or settings</span>
                </div>
              </div>
            </div>

            {/* Staff Card */}
            <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
                  <Users className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Staff</h3>
                  <span className="text-[11px] font-mono text-slate-600">Operational Level 1</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Front-line staff with least-privilege view & operational entry authority. Submits stock counts, logs expense claims, and uploads certificates.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Record daily stock transactions & inventory counts</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit operational expense vouchers</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Upload branded documents & handover proofs</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600">
                  <X className="w-3.5 h-3.5" />
                  <span>Cannot delete any operational business records</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600">
                  <X className="w-3.5 h-3.5" />
                  <span>Cannot access system audit logs or settings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 18-MODULE PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900">Comprehensive 18-Module Default Access Matrix</h2>
              <p className="text-[11px] text-slate-500">
                Default authorization mapped across all corporate modules in the RestoSetup ERP.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-purple-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span> Super Manager
              </span>
              <span className="flex items-center gap-1 text-blue-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Manager
              </span>
              <span className="flex items-center gap-1 text-slate-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Staff
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">ERP Module</th>
                  <th className="py-2.5 px-4">Actions / Operations</th>
                  <th className="py-2.5 px-4 text-center">Super Manager</th>
                  <th className="py-2.5 px-4 text-center">Manager</th>
                  <th className="py-2.5 px-4 text-center">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(MODULE_DEFINITIONS).map(([modKey, def]) => {
                  const superPerms = getRoleDefaultPermissions('super_manager')[modKey as PermissionModuleName] as any;
                  const mgrPerms = getRoleDefaultPermissions('manager')[modKey as PermissionModuleName] as any;
                  const staffPerms = getRoleDefaultPermissions('staff')[modKey as PermissionModuleName] as any;

                  return (
                    <tr key={modKey} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {def.label}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        <div className="flex flex-wrap gap-1">
                          {def.actions.map((a) => (
                            <span key={a.key} className="px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-600 text-[10px] font-mono">
                              {a.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="w-3 h-3" />
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {modKey === 'users' ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700">
                            <X className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {modKey === 'users' || modKey === 'settings' || modKey === 'audit' || modKey === 'excel' ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700">
                            <X className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px]">
                            View/Entry
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BRANCH ACCESS SCOPES */}
      {activeTab === 'branch_access' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900">Branch Access Scope Matrix</h2>
              <p className="text-[11px] text-slate-500">
                Shows operational tenancy and branch boundaries assigned to each user account.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Global Access</th>
                  {branches.map((b) => (
                    <th key={b.id} className="py-2.5 px-3 text-center">
                      {b.code}
                    </th>
                  ))}
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isMaster = isUserMasterAdmin(u);
                  const isSuper = isSuperManagerRole(u.role);
                  const isGlobal = isMaster || isSuper || u.assignedBranchIds?.includes('all');

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                        {getRoleDisplayName(u.role, isMaster)}
                      </td>
                      <td className="py-2.5 px-4">
                        {isGlobal ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                            All Branches (Global)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                            Restricted Scope
                          </span>
                        )}
                      </td>
                      {branches.map((b) => {
                        const hasAccess = isGlobal || u.assignedBranchIds?.includes(b.id);
                        return (
                          <td key={b.id} className="py-2.5 px-3 text-center">
                            {hasAccess ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-2 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          Modify Scope
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900">Security & User Management Audit Log</h2>
              <p className="text-[11px] text-slate-500">
                Immutable chronological log of user creations, role adjustments, status changes, and permission overrides.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Performed By</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Target Entity</th>
                  <th className="py-2.5 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(auditLogs || [])
                  .filter((l) => l.module === 'User' || l.module === 'Settings' || l.summary?.toLowerCase().includes('user') || l.summary?.toLowerCase().includes('role'))
                  .slice(0, 50)
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                      <td className="py-2 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-2 px-4 text-slate-900 font-medium">
                        {log.userName} ({log.userRole})
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-1.5 py-0.5 rounded-xs font-semibold ${
                            log.action === 'Created'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.action === 'Updated'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-600">{log.module} ({log.recordId})</td>
                      <td className="py-2 px-4 text-slate-700 font-sans">{log.summary}</td>
                    </tr>
                  ))}
                {(auditLogs || []).filter((l) => l.module === 'User').length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                      No security audit records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE & EDIT USER MODAL (Single Simple Interface) */}
      {isFormOpen && editingUser && (
        <Modal
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          title={
            editingUser.id
              ? isUserMasterAdmin(editingUser)
                ? 'Master Super Admin Profile'
                : 'Edit User Account & Access'
              : 'Create New User Account'
          }
          subtitle="Configure credentials, role hierarchy, module permissions, and branch scoping"
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-5">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{submitError}</div>
              </div>
            )}

            {/* Master Admin Notice Banner if editing Master Admin */}
            {isUserMasterAdmin(editingUser) && (
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-lg text-xs flex items-start gap-2.5 text-purple-900">
                <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Protected Master Admin Account</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-purple-200 text-purple-800 font-mono font-bold">
                      PERMANENT
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    This account is permanently designated as the highest authority in the ERP. To preserve system integrity, role demotion, deactivation, branch restriction, and account deletion are disabled.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 1: Basic Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Basic Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Corporate Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isUserMasterAdmin(editingUser) || !!editingUser.id}
                    placeholder="manager@restosetup.com"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {editingUser.id ? (
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Security Credentials
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const found = users.find((u) => u.id === editingUser.id) || (editingUser as User);
                        handleOpenChangePassword(found);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Change User Password</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-medium text-slate-700">
                        Initial Password *
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateCreatePassword}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Generate Strong</span>
                        </button>
                        {userPassword && (
                          <button
                            type="button"
                            onClick={handleCopyCreatePassword}
                            className="text-[10px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>{copiedCreatePassword ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type={showCreatePassword ? 'text' : 'password'}
                        required
                        placeholder="Minimum 6 characters (for Firebase Auth)"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-md font-mono focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCreatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Firebase Authentication Backend Integration Settings */}
              {!editingUser.id && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-950">
                      <input
                        type="checkbox"
                        checked={createInFirebaseAuth}
                        onChange={(e) => setCreateInFirebaseAuth(e.target.checked)}
                        className="rounded-xs border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Register in Firebase Authentication backend</span>
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      Instant Sign-In Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Automatically provisions this Manager or Staff user into the <strong>Firebase Authentication backend</strong> with their email & password, enabling immediate sign-in across devices without disrupting the current session.
                  </p>

                  <div className="pt-2 border-t border-blue-200/60 flex flex-wrap gap-4 text-[11px] text-blue-900">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendWelcomeResetEmail}
                        onChange={(e) => setSendWelcomeResetEmail(e.target.checked)}
                        className="rounded-xs border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Send Firebase password reset / welcome email</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requirePasswordChangeOnFirstLogin}
                        onChange={(e) => setRequirePasswordChangeOnFirstLogin(e.target.checked)}
                        className="rounded-xs border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Require password change upon first sign-in</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: Role Selection & Dynamic Permissions Preview */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Role & Default Permissions</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    System Role *
                  </label>
                  {isUserMasterAdmin(editingUser) ? (
                    <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-700" />
                        <span>Master Super Admin</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-slate-200 text-slate-600 font-bold">
                        Locked
                      </span>
                    </div>
                  ) : (
                    <select
                      value={editingUser.role || 'manager'}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        setEditingUser({ ...editingUser, role: newRole });
                        // Keep custom overrides intact, preview updates dynamically
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-hidden"
                    >
                      <option value="super_manager">Super Manager (Full system access, manage users, settings & destructive delete)</option>
                      <option value="manager">Manager (Branch operations, costing, assets, inventory & PO approvals)</option>
                      <option value="staff">Staff (Front-line entry: stock counts, expenses & read-only)</option>
                    </select>
                  )}
                </div>

                {/* Dynamic Role Permission Preview */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Role Permissions Preview: <span className="text-blue-600 capitalize">{editingRole.replace('_', ' ')}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomPermissions(!showCustomPermissions)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{showCustomPermissions ? 'Hide Customize' : 'Customize Permissions'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {/* Default Access */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Default Access (✓)
                      </span>
                      <ul className="space-y-0.5">
                        {defaultAccessList.slice(0, 5).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1 text-slate-700">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Restricted */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                        Restricted (✕)
                      </span>
                      <ul className="space-y-0.5">
                        {defaultRestrictedList.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1 text-slate-600">
                            <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* SECTION: Custom Permissions Overrides Accordion */}
                {showCustomPermissions && (
                  <div className="p-3 bg-white border border-blue-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                      <div>
                        <h5 className="text-xs font-bold text-blue-900">
                          Custom Permission Overrides
                        </h5>
                        <p className="text-[10px] text-slate-500">
                          Override default role capabilities for this specific user.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetToRoleDefaults}
                        className="px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md flex items-center gap-1 cursor-pointer"
                        title="Remove all custom overrides and reset to role defaults"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Role Defaults</span>
                      </button>
                    </div>

                    {/* Module Checkboxes */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {Object.entries(MODULE_DEFINITIONS).map(([modKey, def]) => {
                        const modDef = selectedRoleDefaults[modKey as PermissionModuleName] as any;
                        const modOverrides = customOverrides[modKey] || {};

                        return (
                          <div key={modKey} className="p-2 bg-slate-50 rounded-md border border-slate-200 text-xs">
                            <div className="font-semibold text-slate-800 mb-1.5">{def.label}</div>
                            <div className="flex flex-wrap gap-3">
                              {def.actions.map((act) => {
                                const isDefaultTrue = Boolean(modDef && modDef[act.key]);
                                const hasOverride = modOverrides[act.key] !== undefined;
                                const isChecked = hasOverride ? modOverrides[act.key] : isDefaultTrue;

                                return (
                                  <label key={act.key} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTogglePermissionOverride(modKey, act.key)}
                                      className="rounded-xs text-blue-600 focus:ring-0"
                                    />
                                    <span className={hasOverride ? 'font-bold text-blue-700' : 'text-slate-700'}>
                                      {act.label}
                                    </span>
                                    {hasOverride && (
                                      <span className="text-[9px] font-mono text-blue-600">
                                        ({isChecked ? '+grant' : '-deny'})
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: Branch Access Scope */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Branch Access Scope</span>
              </h4>

              {isUserMasterAdmin(editingUser) ? (
                <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All Branches (Global Access)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-slate-200 text-slate-600 font-bold">
                    Locked
                  </span>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="branchScope"
                        checked={selectedBranchesMode === 'all'}
                        onChange={() => setSelectedBranchesMode('all')}
                        className="text-blue-600 focus:ring-0"
                      />
                      <span className="font-medium text-slate-800">All Branches (Global Access)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="branchScope"
                        checked={selectedBranchesMode === 'custom'}
                        onChange={() => setSelectedBranchesMode('custom')}
                        className="text-blue-600 focus:ring-0"
                      />
                      <span className="font-medium text-slate-800">Selected Branches Only</span>
                    </label>
                  </div>

                  {selectedBranchesMode === 'custom' && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {branches.map((b) => (
                        <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBranchIds.includes(b.id)}
                            onChange={() => handleToggleBranch(b.id)}
                            className="rounded-xs text-blue-600 focus:ring-0"
                          />
                          <span>
                            <strong>{b.code}</strong> - {b.name} ({b.city})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 4: Account Status */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>4. Account Status</span>
              </h4>

              {isUserMasterAdmin(editingUser) ? (
                <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Active (Access Allowed)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-slate-200 text-slate-600 font-bold">
                    Locked
                  </span>
                </div>
              ) : (
                <select
                  value={editingUser.status || 'active'}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="active">Active (Access Allowed)</option>
                  <option value="inactive">Inactive / Suspended (Access Blocked)</option>
                </select>
              )}
            </div>

            {/* Modal Buttons */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCloseForm}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {isSubmitting
                    ? createInFirebaseAuth && !editingUser.id
                      ? 'Registering with Firebase Auth & Saving...'
                      : 'Saving User Profile...'
                    : editingUser.id
                    ? 'Save Changes'
                    : createInFirebaseAuth
                    ? 'Create User & Register in Firebase'
                    : 'Create User Account'}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW PERMISSIONS MODAL */}
      {viewPermissionsUser && (
        <Modal
          isOpen={!!viewPermissionsUser}
          onClose={() => setViewPermissionsUser(null)}
          title={`Permissions Breakdown: ${viewPermissionsUser.name}`}
          subtitle={`Role: ${getRoleDisplayName(viewPermissionsUser.role, isUserMasterAdmin(viewPermissionsUser))} | Email: ${viewPermissionsUser.email}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {isUserMasterAdmin(viewPermissionsUser) && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 font-medium flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0" />
                <span>Master Super Admin has full, universal access granted across every module in the application.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {Object.entries(MODULE_DEFINITIONS).map(([modKey, def]) => {
                const effective = getEffectivePermissions(viewPermissionsUser)[modKey as PermissionModuleName] as any;
                const overrides = viewPermissionsUser.customPermissionOverrides?.[modKey] || {};

                return (
                  <div key={modKey} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
                      {def.label}
                    </span>
                    <div className="space-y-1">
                      {def.actions.map((act) => {
                        const isAllowed = Boolean(effective && effective[act.key]);
                        const isOverridden = overrides[act.key] !== undefined;

                        return (
                          <div key={act.key} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">{act.label}</span>
                            <div className="flex items-center gap-1">
                              {isOverridden && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-amber-100 text-amber-800 font-semibold">
                                  override
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.2 rounded-xs font-semibold ${
                                  isAllowed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isAllowed ? 'Allowed' : 'Denied'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewPermissionsUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CHANGE USER PASSWORD MODAL */}
      {changePasswordModalUser && (
        <Modal
          isOpen={!!changePasswordModalUser}
          onClose={handleCloseChangePasswordModal}
          title="Change User Password"
          subtitle={`Update authentication credentials and access security for ${changePasswordModalUser.name}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {passwordModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{passwordModalError}</div>
              </div>
            )}

            {passwordModalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{passwordModalSuccess}</div>
              </div>
            )}

            {/* User Profile Summary Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {changePasswordModalUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <span>{changePasswordModalUser.name}</span>
                    {isUserMasterAdmin(changePasswordModalUser) && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-purple-100 text-purple-700 font-bold border border-purple-200">
                        Master Admin
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] truncate">
                    {changePasswordModalUser.email}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-slate-200 text-slate-700">
                  {getRoleDisplayName(changePasswordModalUser.role, isUserMasterAdmin(changePasswordModalUser))}
                </span>
                {changePasswordModalUser.passwordLastChangedAt && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    Updated: {formatDate(changePasswordModalUser.passwordLastChangedAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Master Admin Protection Notice */}
            {isUserMasterAdmin(changePasswordModalUser) && !isCurrentUserMaster && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Protected Master Admin:</strong> Only the Master Admin has authority to modify the Master Admin credentials.
                </div>
              </div>
            )}

            <form onSubmit={handleSavePasswordChange} className="space-y-4">
              {/* New Password input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    New Password *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Generate Strong</span>
                    </button>
                    {newPassword && (
                      <button
                        type="button"
                        onClick={copyPasswordToClipboard}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                        title="Copy generated password"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedGenerated ? 'Copied!' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-md font-mono text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Security Strength:</span>
                      <span className={`font-bold ${passwordStrength.text}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-colors ${
                            step <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-md font-mono text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    Passwords do not match.
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Passwords match.</span>
                  </p>
                )}
              </div>

              {/* Security Preferences */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mustChangeOnLogin}
                    onChange={(e) => setMustChangeOnLogin(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-blue-600"
                  />
                  <span className="text-slate-700">
                    Require user to change this password on next login
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendResetEmailCheckbox}
                    onChange={(e) => setSendResetEmailCheckbox(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-blue-600"
                  />
                  <span className="text-slate-700">
                    Send password reset notification email to {changePasswordModalUser.email}
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSendDirectResetEmail}
                  disabled={isSendingDirectResetEmail || isChangingPassword}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Send password reset link directly to user's email"
                >
                  {isSendingDirectResetEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Send Reset Email</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseChangePasswordModal}
                    disabled={isChangingPassword}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isChangingPassword ||
                      !newPassword ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 6 ||
                      (isUserMasterAdmin(changePasswordModalUser) && !isCurrentUserMaster)
                    }
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Save Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* DELETE USER CONFIRM MODAL */}
      {deleteModalUser && (
        <DeleteConfirmModal
          isOpen={!!deleteModalUser}
          onClose={() => setDeleteModalUser(null)}
          onConfirm={async () => {
            await deleteUser(deleteModalUser.id);
          }}
          title="Delete User Account"
          message={`Are you sure you want to permanently delete user account '${deleteModalUser.name}' (${deleteModalUser.email})?`}
          itemName={`${deleteModalUser.name} (${deleteModalUser.email})`}
        />
      )}
    </div>
  );
};
