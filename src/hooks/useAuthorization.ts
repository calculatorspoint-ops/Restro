import { useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CanonicalRole,
  ActionType,
  ResourceType,
  normalizeCanonicalRole,
  hasMinimumRole,
  canAccessRoute,
  canPerformAction,
  isBranchPermitted,
  getRoleBadgeConfig,
  isUserMasterAdmin,
  getEffectivePermissions,
  canView as authCanView,
  canCreate as authCanCreate,
  canEdit as authCanEdit,
  canDelete as authCanDelete,
  canExport as authCanExport,
  canApprove as authCanApprove,
  canManageUsers as authCanManageUsers,
  canManageRoles as authCanManageRoles,
  canManagePermissions as authCanManagePermissions,
  canModifyUser as authCanModifyUser,
  canDeleteUser as authCanDeleteUser,
  canDeactivateUser as authCanDeactivateUser,
  ROUTE_PERMISSION_RULES
} from '../utils/authorization';
import { getRoleDisplayName, PermissionModuleName } from '../types';

export function useAuthorization() {
  const { currentUser, isAuthenticated, isSuperManager, isManager, isStaff, isMasterAdmin } = useAuth();

  const isMaster = useMemo(() => {
    return isMasterAdmin || isUserMasterAdmin(currentUser);
  }, [isMasterAdmin, currentUser]);

  const canonicalRole = useMemo<CanonicalRole>(() => {
    return normalizeCanonicalRole(currentUser?.role, currentUser?.email);
  }, [currentUser?.role, currentUser?.email]);

  const roleDisplayName = useMemo(() => {
    return getRoleDisplayName(canonicalRole, isMaster);
  }, [canonicalRole, isMaster]);

  const badgeConfig = useMemo(() => {
    return getRoleBadgeConfig(currentUser?.role, currentUser?.email, isMaster);
  }, [currentUser?.role, currentUser?.email, isMaster]);

  const effectivePermissions = useMemo(() => {
    return getEffectivePermissions(currentUser);
  }, [currentUser]);

  /**
   * Check if user can execute an action on a resource
   */
  const can = useCallback(
    (action: ActionType, resource?: ResourceType, context?: { branchId?: string }): boolean => {
      const res = canPerformAction(currentUser, action, resource, context);
      return res.allowed;
    },
    [currentUser]
  );

  const canView = useCallback(
    (module: PermissionModuleName, context?: { branchId?: string }) => {
      return authCanView(currentUser, module, context);
    },
    [currentUser]
  );

  const canCreate = useCallback(
    (module: PermissionModuleName, context?: { branchId?: string }) => {
      return authCanCreate(currentUser, module, context);
    },
    [currentUser]
  );

  const canEdit = useCallback(
    (module: PermissionModuleName, context?: { branchId?: string }) => {
      return authCanEdit(currentUser, module, context);
    },
    [currentUser]
  );

  const canDelete = useCallback(
    (module: PermissionModuleName, context?: { branchId?: string }) => {
      return authCanDelete(currentUser, module, context);
    },
    [currentUser]
  );

  const canExport = useCallback(
    (module: 'reports' | 'excel') => {
      return authCanExport(currentUser, module);
    },
    [currentUser]
  );

  const canApprove = useCallback(
    (module: 'purchases') => {
      return authCanApprove(currentUser, module);
    },
    [currentUser]
  );

  const canManageUsers = useCallback(() => {
    return authCanManageUsers(currentUser);
  }, [currentUser]);

  const canManageRoles = useCallback(() => {
    return authCanManageRoles(currentUser);
  }, [currentUser]);

  const canManagePermissions = useCallback(() => {
    return authCanManagePermissions(currentUser);
  }, [currentUser]);

  /**
   * Check if user can access a specific route
   */
  const canRoute = useCallback(
    (routePath: string): boolean => {
      const res = canAccessRoute(currentUser, routePath);
      return res.allowed;
    },
    [currentUser]
  );

  /**
   * Check if a specific branch ID is authorized for current user
   */
  const canBranch = useCallback(
    (branchId?: string): boolean => {
      return isBranchPermitted(currentUser, branchId);
    },
    [currentUser]
  );

  /**
   * High-level convenience permissions based on least-privilege matrix
   */
  const permissions = useMemo(() => {
    return {
      canManageUsers: canManageUsers(),
      canManageRoles: canManageRoles(),
      canManagePermissions: canManagePermissions(),
      canManageSettings: can('manage_settings', 'settings'),
      canDeleteBranches: can('delete_branch', 'branches'),
      canDeleteProjects: can('delete_project', 'projects'),
      canDeleteRecords: can('delete_record'),
      canViewAuditLog: can('read', 'audit'),
      canUseExcelCenter: can('read', 'excel')
    };
  }, [can, canManageUsers, canManageRoles, canManagePermissions]);

  return {
    currentUser,
    isAuthenticated,
    isMasterAdmin: isMaster,
    canonicalRole,
    roleDisplayName,
    badgeConfig,
    isSuperManager,
    isManager,
    isStaff,
    effectivePermissions,
    hasMinimumRole: (req: CanonicalRole) => hasMinimumRole(canonicalRole, req),
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canApprove,
    canManageUsers,
    canManageRoles,
    canManagePermissions,
    canAccessBranch: canBranch,
    canRoute,
    canBranch,
    canModifyUser: (target: any) => authCanModifyUser(currentUser, target),
    canDeleteUser: (target: any) => authCanDeleteUser(currentUser, target),
    canDeactivateUser: (target: any) => authCanDeactivateUser(currentUser, target),
    permissions,
    ROUTE_PERMISSION_RULES
  };
}
