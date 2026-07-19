import { ProjectService } from '@/lib/services';
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
    const { UserService } = await import('@/lib/services');
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('projects.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const stats = await ProjectService.getStats();
    return successResponse(res, stats);
  } catch (error) {
    console.error('Project stats error:', error);
    return errorResponse(res, 'Failed to get project stats', 500);
  }
}
