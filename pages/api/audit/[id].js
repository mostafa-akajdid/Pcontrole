import { AuditService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api';

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
      return forbiddenResponse(res, 'Insufficient permissions to view audit logs');
    }

    const { id } = req.query;
    const log = await AuditService.findById(id);
    if (!log) {
      return notFoundResponse(res, 'Audit log not found');
    }
    return successResponse(res, log);
  } catch (error) {
    console.error('Get audit log error:', error);
    return errorResponse(res, error.message || 'Failed to get audit log', 500);
  }
}
