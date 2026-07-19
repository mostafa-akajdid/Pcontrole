import { useAuth } from '@/contexts/AuthContext';

export function usePermission() {
  const { user, hasPermission, hasAnyPermission, isAdmin } = useAuth();

  const can = (permission) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return hasPermission(permission);
  };

  const canAny = (permissions) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return hasAnyPermission(permissions);
  };

  const canAll = (permissions) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return permissions.every((p) => user.permissions?.includes(p));
  };

  const cannot = (permission) => !can(permission);

  const role = user?.role?.name || null;

  return { can, canAny, canAll, cannot, role, isAdmin: isAdmin() };
}
