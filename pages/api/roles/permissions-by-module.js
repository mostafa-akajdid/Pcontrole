import { RoleService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('roles.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const grouped = await RoleService.getPermissionsByModule();
    return successResponse(res, grouped);
  } catch (error) {
    console.error('Get permissions by module error:', error);
    return errorResponse(res, error.message || 'Failed to get permissions', 500);
  }
}
