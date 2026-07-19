import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function usePermission() {
  const { user, hasPermission, hasAnyPermission, isAdmin } = useAuth();

  const can = useCallback((permission) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return hasPermission(permission);
  }, [user, isAdmin, hasPermission]);

  const canAny = useCallback((permissions) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return hasAnyPermission(permissions);
  }, [user, isAdmin, hasAnyPermission]);

  const canAll = useCallback((permissions) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return permissions.every((p) => user.permissions?.includes(p));
  }, [user, isAdmin]);

  const cannot = useCallback((permission) => !can(permission), [can]);

  const role = user?.role?.name || null;

  return { can, canAny, canAll, cannot, role, isAdmin: isAdmin() };
}
