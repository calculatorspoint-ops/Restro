import React from 'react';
import { useAuthorization } from '../../hooks/useAuthorization';
import { ActionType, ResourceType } from '../../utils/authorization';

interface AuthorizeProps {
  action: ActionType;
  resource?: ResourceType;
  context?: { branchId?: string };
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative component for least-privilege action and element authorization.
 * Wraps buttons, tabs, or panels that require specific permissions.
 */
export const Authorize: React.FC<AuthorizeProps> = ({
  action,
  resource,
  context,
  fallback = null,
  children
}) => {
  const { can } = useAuthorization();

  const isAllowed = can(action, resource, context);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
