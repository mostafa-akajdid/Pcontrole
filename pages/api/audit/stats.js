import { AuditService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  try {
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
