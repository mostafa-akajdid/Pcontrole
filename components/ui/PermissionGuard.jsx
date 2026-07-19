import { usePermission } from '@/hooks/usePermission';

export default function PermissionGuard({ permission, permissions, requireAll = false, children, fallback = null }) {
  const { can, canAny, canAll } = usePermission();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
}
