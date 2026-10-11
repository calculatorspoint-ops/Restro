import {
  User,
  UserRole,
  isSuperManagerRole,
  isManagerRole,
  isStaffRole,
  getRoleDisplayName,
  AppPermissions,
  PermissionModuleName
} from '../types';

/**
 * Canonical Role System:
 * 1. super_manager (Super Manager - Highest application-level privilege)
 * 2. manager (Manager - Operational management across assigned branches)
 * 3. staff (Staff - Operational entry & view with least privilege)
 */
export type CanonicalRole = 'super_manager' | 'manager' | 'staff';

export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'approve'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_settings'
  | 'delete_branch'
  | 'delete_project'
  | 'delete_record';

export type ResourceType =
  | 'dashboard'
  | 'branches'
  | 'projects'
  | 'construction'
  | 'electrical'
  | 'hvac'
  | 'furniture'
  | 'kitchen'
  | 'it_pos'
  | 'assets'
  | 'inventory'
  | 'recipes'
  | 'purchases'
  | 'suppliers'
  | 'expenses'
  | 'handover'
  | 'branded_docs'
  | 'locations'
  | 'reports'
  | 'excel'
  | 'users'
  | 'settings'
  | 'audit';

export const ROLE_LEVELS: Record<CanonicalRole, number> = {
  super_manager: 3,
  manager: 2,
  staff: 1
};

/**
 * Permanent Master Admin & Owner emails.
 * muhammadkhurram@gmail.com is the primary designated Master Admin.
 * muhammadkhurram682@gmail.com is the Google Auth account alias in AI Studio.
 */
export const MASTER_ADMIN_UIDS = [
  'lVNGCaPfb7hExlXRR8b7VMw9X4A2'
];

export const MASTER_ADMIN_EMAILS = [
  'muhammadkhurram@gmail.com',
  'muhammadkhurram682@gmail.com'
];

export const PRIMARY_OWNER_EMAILS = [
  'muhammadkhurram@gmail.com',
  'muhammadkhurram682@gmail.com',
  'admin@restosetup.com'
];

/**
 * Checks whether user is the protected Master Admin & Owner
 */
export function isUserMasterAdmin(user?: Partial<User> | null): boolean {
  if (!user) return false;
  if (user.isMasterAdmin === true) return true;
  if (user.id && MASTER_ADMIN_UIDS.includes(user.id)) return true;
  const email = (user.email || '').trim().toLowerCase();
  return MASTER_ADMIN_EMAILS.includes(email);
}

/**
 * Role default permissions matrix across all 18 modules
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<CanonicalRole, AppPermissions> = {
  super_manager: {
    dashboard: { view: true },
    branches: { view: true, create: true, edit: true, delete: true },
    projects: { view: true, create: true, edit: true, delete: true },
    construction: { view: true, create: true, edit: true, delete: true },
    assets: { view: true, create: true, edit: true, delete: true },
    inventory: { view: true, create: true, edit: true, delete: true },
    purchases: { view: true, create: true, edit: true, delete: true, approve: true },
    suppliers: { view: true, create: true, edit: true, delete: true },
    expenses: { view: true, create: true, edit: true, delete: true },
    recipes: { view: true, create: true, edit: true, delete: true },
    locations: { view: true, create: true, edit: true, delete: true },
    handover: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, export: true },
    excel: { import: true, export: true },
    audit: { view: true },
    users: { view: true, create: true, edit: true, delete: true, manage_roles: true, manage_permissions: true },
    settings: { view: true, edit: true }
  },
  manager: {
    dashboard: { view: true },
    branches: { view: true, create: true, edit: true, delete: false },
    projects: { view: true, create: true, edit: true, delete: false },
    construction: { view: true, create: true, edit: true, delete: true },
    assets: { view: true, create: true, edit: true, delete: true },
    inventory: { view: true, create: true, edit: true, delete: true },
    purchases: { view: true, create: true, edit: true, delete: true, approve: true },
    suppliers: { view: true, create: true, edit: true, delete: true },
    expenses: { view: true, create: true, edit: true, delete: true },
    recipes: { view: true, create: true, edit: true, delete: true },
    locations: { view: true, create: true, edit: true, delete: true },
    handover: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, export: true },
    excel: { import: true, export: true },
    audit: { view: true },
    users: { view: false, create: false, edit: false, delete: false, manage_roles: false, manage_permissions: false },
    settings: { view: true, edit: false }
  },
  staff: {
    dashboard: { view: true },
    branches: { view: true, create: false, edit: false, delete: false },
    projects: { view: true, create: false, edit: false, delete: false },
    construction: { view: true, create: false, edit: false, delete: false },
    assets: { view: true, create: false, edit: false, delete: false },
    inventory: { view: true, create: true, edit: true, delete: false },
    purchases: { view: true, create: false, edit: false, delete: false, approve: false },
    suppliers: { view: true, create: false, edit: false, delete: false },
    expenses: { view: true, create: true, edit: false, delete: false },
    recipes: { view: true, create: false, edit: false, delete: false },
    locations: { view: true, create: false, edit: false, delete: false },
    handover: { view: true, create: false, edit: false, delete: false },
    documents: { view: true, create: true, edit: false, delete: false },
    reports: { view: true, export: false },
    excel: { import: false, export: false },
    audit: { view: false },
    users: { view: false, create: false, edit: false, delete: false, manage_roles: false, manage_permissions: false },
    settings: { view: false, edit: false }
  }
};

/**
 * Returns deep-cloned default permissions for a role
 */
export function getRoleDefaultPermissions(role: CanonicalRole): AppPermissions {
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.staff;
  return JSON.parse(JSON.stringify(defaults));
}

/**
 * Computes effective permissions for a user by merging role defaults with custom overrides
 */
export function getEffectivePermissions(user?: Partial<User> | null): AppPermissions {
  if (!user) {
    return getRoleDefaultPermissions('staff');
  }

  // Master Admin has full, unrestricted authority across everything
  if (isUserMasterAdmin(user)) {
    return getRoleDefaultPermissions('super_manager');
  }

  const role = normalizeCanonicalRole(user.role, user.email);
  const base = getRoleDefaultPermissions(role);

  if (user.customPermissionOverrides && typeof user.customPermissionOverrides === 'object') {
    Object.keys(user.customPermissionOverrides).forEach((modKey) => {
      const moduleKey = modKey as keyof AppPermissions;
      if (base[moduleKey]) {
        const overridesForModule = user.customPermissionOverrides?.[moduleKey];
        if (overridesForModule && typeof overridesForModule === 'object') {
          Object.keys(overridesForModule).forEach((actionKey) => {
            (base[moduleKey] as any)[actionKey] = Boolean(overridesForModule[actionKey]);
          });
        }
      }
    });
  }

  return base;
}

/**
 * Returns a preview list of what a role can do by default
 */
export function getRoleDefaultAccessList(role: CanonicalRole): string[] {
  switch (role) {
    case 'super_manager':
      return [
        'Complete administrative authority across all modules',
        'Create, edit, and delete restaurant branches',
        'Create, edit, and delete fit-out projects',
        'Full asset, equipment, and milestone management',
        'Full inventory, recipe costing, and vendor orders',
        'User administration, role assignment & custom permissions',
        'Global branch access across all locations',
        'System settings and organizational parameter controls'
      ];
    case 'manager':
      return [
        'View, create, and edit branches and setup projects',
        'Manage assets (Kitchen, HVAC, Furniture, Electrical, IT)',
        'Record construction milestones and costing items',
        'Manage raw material inventory and stock movements',
        'Issue and approve purchase orders and invoices',
        'Log operational expense vouchers',
        'Formulate recipes and calculate COGS',
        'Export reports and access Excel Import/Export Center'
      ];
    case 'staff':
    default:
      return [
        'View dashboard metrics and branch operational directories',
        'View equipment register and physical room inventories',
        'Enter stock counts and daily inventory adjustments',
        'Submit operational expense vouchers for reimbursement',
        'Upload handover certificates and branded documents',
        'Read recipe formulations and preparation instructions'
      ];
  }
}

/**
 * Returns a preview list of what a role is restricted from by default
 */
export function getRoleRestrictedAccessList(role: CanonicalRole): string[] {
  switch (role) {
    case 'super_manager':
      return ['Protected Master Admin accounts cannot be deleted or demoted'];
    case 'manager':
      return [
        'Cannot delete restaurant branches or setup projects',
        'Cannot access user administration or modify account roles',
        'Cannot alter corporate branding or fiscal tax rates in settings',
        'Restricted to assigned branch IDs unless granted global access'
      ];
    case 'staff':
    default:
      return [
        'Cannot delete any operational or financial records',
        'Cannot modify corporate branches, projects, or milestones',
        'Cannot approve purchase orders or vendor agreements',
        'Cannot access system audit logs or bulk Excel import',
        'Cannot access user administration or system settings'
      ];
  }
}

/**
 * Normalizes any role string or alias to the canonical 3-role system
 */
export function normalizeCanonicalRole(role?: string, email?: string): CanonicalRole {
  const normEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (normEmail && PRIMARY_OWNER_EMAILS.includes(normEmail)) {
    if (role === 'staff' || role === 'manager') {
      return role;
    }
    return 'super_manager';
  }
  if (normEmail === 'manager@restosetup.com' && (!role || role === 'staff')) {
    return 'manager';
  }
  if (!role || typeof role !== 'string') return 'staff';
  const clean = role.toLowerCase().replace(/[\s-]/g, '_');
  if (clean === 'super_manager' || clean === 'super_admin') {
    return 'super_manager';
  }
  if (clean === 'manager' || clean === 'admin') {
    return 'manager';
  }
  return 'staff';
}

/**
 * Checks whether user meets minimum role level in the hierarchy
 */
export function hasMinimumRole(userRole: CanonicalRole, requiredRole: CanonicalRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

/**
 * Checks whether user has permission to view or manipulate a specific branch ID
 */
export function isBranchPermitted(user: User | null, branchId?: string): boolean {
  if (!user) return false;
  if (isUserMasterAdmin(user)) return true;
  const role = normalizeCanonicalRole(user.role, user.email);
  if (role === 'super_manager') return true;
  if (!branchId || branchId === 'all') return true;
  if (user.assignedBranchIds?.includes('all')) return true;
  return user.assignedBranchIds?.includes(branchId) || false;
}

/**
 * Evaluates whether a user can execute a specific CRUD action on a module
 */
export function canUser(
  user: User | null,
  module: PermissionModuleName,
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'import' | 'manage_roles' | 'manage_permissions',
  context?: { branchId?: string }
): boolean {
  if (!user) return false;
  if (user.status === 'inactive') return false;

  // Master Admin has universal access
  if (isUserMasterAdmin(user)) return true;

  // Branch check if branchId is provided
  if (context?.branchId && !isBranchPermitted(user, context.branchId)) {
    return false;
  }

  const effective = getEffectivePermissions(user);
  const modPerms = effective[module] as any;
  if (!modPerms) return false;

  return Boolean(modPerms[action]);
}

/**
 * Granular Centralized Authorization Methods (Section 23)
 */
export function canView(user: User | null, module: PermissionModuleName, context?: { branchId?: string }): boolean {
  return canUser(user, module, 'view', context);
}

export function canCreate(user: User | null, module: PermissionModuleName, context?: { branchId?: string }): boolean {
  return canUser(user, module, 'create', context);
}

export function canEdit(user: User | null, module: PermissionModuleName, context?: { branchId?: string }): boolean {
  return canUser(user, module, 'edit', context);
}

export function canDelete(user: User | null, module: PermissionModuleName, context?: { branchId?: string }): boolean {
  return canUser(user, module, 'delete', context);
}

export function canExport(user: User | null, module: 'reports' | 'excel'): boolean {
  return canUser(user, module, 'export');
}

export function canApprove(user: User | null, module: 'purchases'): boolean {
  return canUser(user, module, 'approve');
}

export function canManageUsers(user: User | null): boolean {
  if (!user) return false;
  if (isUserMasterAdmin(user)) return true;
  return canUser(user, 'users', 'view') && canUser(user, 'users', 'edit');
}

export function canManageRoles(user: User | null): boolean {
  if (!user) return false;
  if (isUserMasterAdmin(user)) return true;
  return canUser(user, 'users', 'manage_roles');
}

export function canManagePermissions(user: User | null): boolean {
  if (!user) return false;
  if (isUserMasterAdmin(user)) return true;
  return canUser(user, 'users', 'manage_permissions');
}

export function canAccessBranch(user: User | null, branchId?: string): boolean {
  return isBranchPermitted(user, branchId);
}

/**
 * Protection Rules for Master Admin and User Management (Section 2 & 18)
 */
export function canModifyUser(currentUser: User | null, targetUser: Partial<User>): boolean {
  if (!currentUser) return false;
  if (currentUser.status === 'inactive') return false;

  // Master Admin can modify any user
  if (isUserMasterAdmin(currentUser)) return true;

  // If target is Master Admin, NO ONE ELSE can modify them!
  if (isUserMasterAdmin(targetUser)) return false;

  const currentRole = normalizeCanonicalRole(currentUser.role, currentUser.email);
  return currentRole === 'super_manager' && canUser(currentUser, 'users', 'edit');
}

export function canDeleteUser(currentUser: User | null, targetUser: Partial<User>): boolean {
  if (!currentUser) return false;
  if (currentUser.status === 'inactive') return false;

  // Master Admin CAN NEVER BE DELETED by anyone
  if (isUserMasterAdmin(targetUser)) return false;

  // Master Admin can delete other users
  if (isUserMasterAdmin(currentUser)) return true;

  const currentRole = normalizeCanonicalRole(currentUser.role, currentUser.email);
  return currentRole === 'super_manager' && canUser(currentUser, 'users', 'delete');
}

export function canDeactivateUser(currentUser: User | null, targetUser: Partial<User>): boolean {
  if (!currentUser) return false;
  if (currentUser.status === 'inactive') return false;

  // Master Admin CAN NEVER BE DEACTIVATED by anyone
  if (isUserMasterAdmin(targetUser)) return false;

  // Master Admin can deactivate others
  if (isUserMasterAdmin(currentUser)) return true;

  const currentRole = normalizeCanonicalRole(currentUser.role, currentUser.email);
  return currentRole === 'super_manager' && canUser(currentUser, 'users', 'edit');
}

export function canChangeUserRole(currentUser: User | null, targetUser: Partial<User>, newRole: UserRole): boolean {
  if (!currentUser) return false;
  if (currentUser.status === 'inactive') return false;

  // Master Admin role CANNOT be demoted or changed
  if (isUserMasterAdmin(targetUser)) return false;

  // Only Master Admin can create or promote additional Super Managers
  if (isSuperManagerRole(newRole) && !isUserMasterAdmin(currentUser)) {
    return false;
  }

  if (isUserMasterAdmin(currentUser)) return true;

  const currentRole = normalizeCanonicalRole(currentUser.role, currentUser.email);
  return currentRole === 'super_manager' && canUser(currentUser, 'users', 'manage_roles');
}

/**
 * Route-to-Role Least-Privilege Protection Rules
 */
export interface RoutePermissionRule {
  path: string;
  resource: ResourceType;
  minimumRole: CanonicalRole;
  description: string;
}

export const ROUTE_PERMISSION_RULES: Record<string, RoutePermissionRule> = {
  '/dashboard': {
    path: '/dashboard',
    resource: 'dashboard',
    minimumRole: 'staff',
    description: 'Executive Dashboard & Overview'
  },
  '/branches': {
    path: '/branches',
    resource: 'branches',
    minimumRole: 'staff',
    description: 'Branch Management & Directory'
  },
  '/projects': {
    path: '/projects',
    resource: 'projects',
    minimumRole: 'staff',
    description: 'Branch Setup Projects'
  },
  '/construction': {
    path: '/construction',
    resource: 'construction',
    minimumRole: 'staff',
    description: 'Construction Costing & Fit-Out'
  },
  '/electrical': {
    path: '/electrical',
    resource: 'electrical',
    minimumRole: 'staff',
    description: 'Electrical & Lighting Fixtures'
  },
  '/hvac': {
    path: '/hvac',
    resource: 'hvac',
    minimumRole: 'staff',
    description: 'HVAC & Cooling Systems'
  },
  '/furniture': {
    path: '/furniture',
    resource: 'furniture',
    minimumRole: 'staff',
    description: 'Furniture & Fixtures'
  },
  '/kitchen': {
    path: '/kitchen',
    resource: 'kitchen',
    minimumRole: 'staff',
    description: 'Kitchen Equipment & Appliances'
  },
  '/it-pos': {
    path: '/it-pos',
    resource: 'it_pos',
    minimumRole: 'staff',
    description: 'IT & Point of Sale (POS) Systems'
  },
  '/assets': {
    path: '/assets',
    resource: 'assets',
    minimumRole: 'staff',
    description: 'Central Asset Register'
  },
  '/inventory': {
    path: '/inventory',
    resource: 'inventory',
    minimumRole: 'staff',
    description: 'Inventory & Stock Management'
  },
  '/recipes': {
    path: '/recipes',
    resource: 'recipes',
    minimumRole: 'staff',
    description: 'Recipe & Menu Costing (COGS)'
  },
  '/purchases': {
    path: '/purchases',
    resource: 'purchases',
    minimumRole: 'staff',
    description: 'Purchase Orders & Invoices'
  },
  '/suppliers': {
    path: '/suppliers',
    resource: 'suppliers',
    minimumRole: 'staff',
    description: 'Suppliers & Vendors Directory'
  },
  '/expenses': {
    path: '/expenses',
    resource: 'expenses',
    minimumRole: 'staff',
    description: 'Operational Expense Vouchers'
  },
  '/handover': {
    path: '/handover',
    resource: 'handover',
    minimumRole: 'staff',
    description: 'Branch Handover Report'
  },
  '/branded-docs': {
    path: '/branded-docs',
    resource: 'branded_docs',
    minimumRole: 'staff',
    description: 'Branded Documents & PDF Export'
  },
  '/locations': {
    path: '/locations',
    resource: 'locations',
    minimumRole: 'staff',
    description: 'Location & Room Inventory'
  },
  '/reports': {
    path: '/reports',
    resource: 'reports',
    minimumRole: 'staff',
    description: 'Executive Management Reports'
  },
  '/excel': {
    path: '/excel',
    resource: 'excel',
    minimumRole: 'manager',
    description: 'Excel Import & Export Center (Manager & Super Manager only)'
  },
  '/audit': {
    path: '/audit',
    resource: 'audit',
    minimumRole: 'manager',
    description: 'System Audit Trail Log (Manager & Super Manager only)'
  },
  '/settings': {
    path: '/settings',
    resource: 'settings',
    minimumRole: 'super_manager',
    description: 'System & Organization Settings (Super Manager Only)'
  },
  '/users': {
    path: '/users',
    resource: 'users',
    minimumRole: 'super_manager',
    description: 'User Roles & Access Control (Super Manager Only)'
  }
};

export interface RouteAuthorizationResult {
  allowed: boolean;
  userRole: CanonicalRole;
  requiredRole?: CanonicalRole;
  reason?: string;
  isInactive?: boolean;
}

/**
 * Evaluates whether a user can access a specific frontend route path
 */
export function canAccessRoute(user: User | null, routePath: string): RouteAuthorizationResult {
  if (!user) {
    return {
      allowed: false,
      userRole: 'staff',
      reason: 'Authentication required. Please log in to your RestoSetup ERP account.'
    };
  }

  if (user.status === 'inactive') {
    return {
      allowed: false,
      userRole: 'staff',
      isInactive: true,
      reason: 'Your account is currently inactive or suspended. Please contact your Super Manager.'
    };
  }

  // Master Admin can access any route
  if (isUserMasterAdmin(user)) {
    return { allowed: true, userRole: 'super_manager' };
  }

  const role = normalizeCanonicalRole(user.role, user.email);
  const normalizedPath = (routePath || '').replace(/\/$/, '') || '/dashboard';
  const rule = ROUTE_PERMISSION_RULES[normalizedPath];

  // If path is not registered (e.g. 404 or dynamic), default allow if authenticated
  if (!rule) {
    return { allowed: true, userRole: role };
  }

  const allowed = hasMinimumRole(role, rule.minimumRole);

  if (!allowed) {
    return {
      allowed: false,
      userRole: role,
      requiredRole: rule.minimumRole,
      reason: `Access to "${rule.description}" requires ${getRoleDisplayName(rule.minimumRole)} privileges.`
    };
  }

  return { allowed: true, userRole: role, requiredRole: rule.minimumRole };
}

/**
 * Evaluates whether a user can execute a specific CRUD action on a resource
 */
export function canPerformAction(
  user: User | null,
  action: ActionType,
  resource?: ResourceType,
  context?: { branchId?: string }
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Authentication required.' };
  }

  if (user.status === 'inactive') {
    return { allowed: false, reason: 'Account is deactivated.' };
  }

  // Master Admin has universal access
  if (isUserMasterAdmin(user)) {
    return { allowed: true };
  }

  const role = normalizeCanonicalRole(user.role, user.email);

  // Check branch scoping if branchId provided
  if (context?.branchId && !isBranchPermitted(user, context.branchId)) {
    return {
      allowed: false,
      reason: 'You do not have authorization for this branch scope.'
    };
  }

  // 1. Super Manager: Universal permission across all modules & actions
  if (role === 'super_manager') {
    return { allowed: true };
  }

  // 2. High-Privilege Administration Actions (Super Manager ONLY)
  if (
    action === 'manage_users' ||
    action === 'manage_roles' ||
    action === 'manage_settings' ||
    action === 'delete_branch' ||
    action === 'delete_project'
  ) {
    return {
      allowed: false,
      reason: 'This administrative operation is strictly reserved for Super Managers.'
    };
  }

  if (resource === 'users' || resource === 'settings') {
    return {
      allowed: false,
      reason: 'User management and system settings require Super Manager authorization.'
    };
  }

  // 3. Check granular permissions if present
  if (resource) {
    const modMap: Record<ResourceType, PermissionModuleName> = {
      dashboard: 'dashboard',
      branches: 'branches',
      projects: 'projects',
      construction: 'construction',
      electrical: 'assets',
      hvac: 'assets',
      furniture: 'assets',
      kitchen: 'assets',
      it_pos: 'assets',
      assets: 'assets',
      inventory: 'inventory',
      recipes: 'recipes',
      purchases: 'purchases',
      suppliers: 'suppliers',
      expenses: 'expenses',
      handover: 'handover',
      branded_docs: 'documents',
      locations: 'locations',
      reports: 'reports',
      excel: 'excel',
      users: 'users',
      settings: 'settings',
      audit: 'audit'
    };

    const targetMod = modMap[resource];
    if (targetMod) {
      const actKey = action === 'read' ? 'view' : action === 'update' ? 'edit' : action;
      if (canUser(user, targetMod, actKey as any, context)) {
        return { allowed: true };
      }
    }
  }

  // 4. Manager Role Permissions fallback
  if (role === 'manager') {
    if (resource === 'branches' && action === 'delete') {
      return { allowed: false, reason: 'Managers cannot delete branches.' };
    }
    if (resource === 'projects' && action === 'delete') {
      return { allowed: false, reason: 'Managers cannot delete projects.' };
    }
    return { allowed: true };
  }

  // 5. Staff Role Permissions fallback
  if (role === 'staff') {
    if (action === 'delete' || action === 'delete_record') {
      return {
        allowed: false,
        reason: 'Staff users are not permitted to delete business records.'
      };
    }

    if (resource === 'audit') {
      return {
        allowed: false,
        reason: 'Audit logs are reserved for Management and Super Management.'
      };
    }

    if (resource === 'excel') {
      return {
        allowed: false,
        reason: 'Bulk Excel database import and export requires Manager authorization.'
      };
    }

    if (action === 'read' || action === 'export') {
      return { allowed: true };
    }

    if (action === 'create' || action === 'update') {
      const allowedStaffWriteResources: ResourceType[] = [
        'inventory',
        'expenses',
        'purchases',
        'locations',
        'handover'
      ];
      if (resource && allowedStaffWriteResources.includes(resource)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Staff privileges do not permit modifications to this resource.'
      };
    }

    return { allowed: false, reason: 'Operation restricted by role policy.' };
  }

  return { allowed: false, reason: 'Role not recognized.' };
}

/**
 * Standard visual badge configurations for roles
 */
export function getRoleBadgeConfig(role?: string, email?: string, isMasterAdmin?: boolean) {
  if (isMasterAdmin || (email && MASTER_ADMIN_EMAILS.includes(email.toLowerCase().trim()))) {
    return {
      label: 'Master Super Admin',
      color: 'text-amber-800',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      dotColor: 'bg-amber-500',
      description: 'Permanent Master Admin & Owner account with protected global authority'
    };
  }

  const canonical = normalizeCanonicalRole(role, email);
  switch (canonical) {
    case 'super_manager':
      return {
        label: 'Super Manager',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        dotColor: 'bg-purple-600',
        description: 'Universal administrative authority, user management & destructive controls'
      };
    case 'manager':
      return {
        label: 'Manager',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        dotColor: 'bg-blue-600',
        description: 'Operational manager with branch costing, asset, inventory & record controls'
      };
    case 'staff':
    default:
      return {
        label: 'Staff',
        color: 'text-slate-700',
        bgColor: 'bg-slate-100',
        borderColor: 'border-slate-200',
        dotColor: 'bg-slate-500',
        description: 'Operational entry & view access with restricted deletion and settings'
      };
  }
}
