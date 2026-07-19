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

    const stats = await RoleService.getStats();
    return successResponse(res, stats);
  } catch (error) {
    console.error('Get role stats error:', error);
    return errorResponse(res, error.message || 'Failed to get role stats', 500);
  }
}
