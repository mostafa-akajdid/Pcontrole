import { AuditService, UserService } from '@/lib/services';
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
    let user;
    try {
      user = await UserService.findById(tokenPayload.userId);
    } catch {
      return unauthorizedResponse(res);
    }

    if (!user || !user.permissions?.includes('audit.view')) {
      return forbiddenResponse(res, 'Insufficient permissions to view audit stats');
    }

    const [stats, moduleCounts] = await Promise.all([
      AuditService.getStats(),
      AuditService.getModuleCounts(),
    ]);
    return successResponse(res, { stats, moduleCounts });
  } catch (error) {
    console.error('Get audit stats error:', error);
    return errorResponse(res, error.message || 'Failed to get audit stats', 500);
  }
}
