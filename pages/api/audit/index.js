import { AuditService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';
import { parsePagination, buildPagination, parseSearch } from '@/lib/pagination';

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

    const { page, perPage } = parsePagination(req.query);
    const search = parseSearch(req.query);
    const { module, action, entityType, userId, startDate, endDate } = req.query;

    const result = await AuditService.findAll({
      page,
      perPage,
      module: module || null,
      action: action || null,
      entityType: entityType || null,
      userId: userId || null,
      search,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    const pagination = buildPagination(result.total, page, perPage);
    return successResponse(res, { items: result.items, pagination });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return errorResponse(res, error.message || 'Failed to get audit logs', 500);
  }
}
