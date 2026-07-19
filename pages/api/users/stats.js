import { UserService } from '@/lib/services';
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
    const admin = await UserService.findById(tokenPayload.userId);
    if (!admin.permissions?.includes('users.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const stats = await UserService.getStats();
    return successResponse(res, stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    return errorResponse(res, error.message || 'Failed to get user stats', 500);
  }
}
