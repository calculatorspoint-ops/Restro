import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  canAccessRoute,
  CanonicalRole,
  getRoleBadgeConfig,
  normalizeCanonicalRole
} from '../../utils/authorization';
import { getRoleDisplayName } from '../../types';

interface AuthorizedRouteProps {
  routePath: string;
  requiredRole?: CanonicalRole;
  children: React.ReactNode;
}

export const AuthorizedRoute: React.FC<AuthorizedRouteProps> = ({
  routePath,
  requiredRole,
  children
}) => {
  const { currentUser, isAuthenticated, authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span>Verifying role authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const check = canAccessRoute(currentUser, routePath);

  // If user account is inactive / suspended in Firestore
  if (check.isInactive) {
    const isPending = currentUser?.status === 'pending';
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-xl border border-rose-200 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {isPending ? 'Account Pending Approval' : 'Account Inactive / Suspended'}
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {isPending
              ? 'Your account has been created and is awaiting activation by a Super Manager. Please contact your system administrator to have your account approved and branch access assigned.'
              : 'Your user profile has been marked inactive by your organization\'s Super Manager. All ERP read and write capabilities are temporarily suspended.'}
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 border border-slate-200">
          User: <strong>{currentUser?.email}</strong>
        </div>
      </div>
    );
  }

  // If role is insufficient for this route
  if (!check.allowed) {
    const userRole = normalizeCanonicalRole(currentUser?.role, currentUser?.email);
    const userBadge = getRoleBadgeConfig(userRole);
    const requiredBadge = check.requiredRole ? getRoleBadgeConfig(check.requiredRole) : null;

    return (
      <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 bg-white rounded-xl border border-slate-200 shadow-xs text-center space-y-6">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            Least-Privilege Role Protection
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            {check.reason || 'You do not possess the required privileges to view or interact with this ERP module.'}
          </p>
        </div>

        {/* Comparison Matrix of Current vs Required */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Your Current Role
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${userBadge.dotColor}`} />
              <span className={`text-xs font-bold ${userBadge.color}`}>
                {userBadge.label}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1 line-clamp-2">
              {userBadge.description}
            </span>
          </div>

          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-500 block mb-1">
              Required Level
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${requiredBadge?.dotColor || 'bg-blue-600'}`} />
              <span className={`text-xs font-bold ${requiredBadge?.color || 'text-blue-700'}`}>
                {requiredBadge?.label || 'Super Manager'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1 line-clamp-2">
              {requiredBadge?.description || 'Administrative privileges'}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto min-h-[38px] px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:bg-blue-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Executive Dashboard</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
          Security policy enforced by RestoSetup ERP Role-Based Access Control (RBAC).
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
