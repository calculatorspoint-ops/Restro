import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthorization } from '../../hooks/useAuthorization';
import { canAccessRoute } from '../../utils/authorization';
import { getRoleDisplayName } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  path: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, path }) => {
  const { currentUser, isAuthenticated, authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const access = canAccessRoute(currentUser, path);

  if (!access.allowed) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-xl border border-slate-200 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          {access.reason || 'You do not have permission to access this module.'}
        </p>
        <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 max-w-sm mx-auto border border-slate-200 flex items-center justify-between">
          <span>Your Role:</span>
          <span className="text-blue-700 font-bold">{getRoleDisplayName(access.userRole)}</span>
        </div>
        {access.requiredRole && (
          <div className="p-3 bg-blue-50/60 rounded-lg text-xs font-mono text-blue-800 max-w-sm mx-auto border border-blue-100 flex items-center justify-between">
            <span>Required Role:</span>
            <span className="font-bold">{getRoleDisplayName(access.requiredRole)} or higher</span>
          </div>
        )}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs active:bg-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
};
