import { ProjectService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { parsePagination, buildPagination, parseSearch } from '@/lib/pagination';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, paginatedResponse } from '@/lib/api';

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
    if (!user.permissions?.includes('projects.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const { page, perPage } = parsePagination(req.query);
    const search = parseSearch(req.query);
    const { sort, order } = req.query;

    const result = await ProjectService.findDeleted({
      page,
      perPage,
      search,
      sort: sort || 'deletedAt',
      order: order || 'desc',
    });

    const pagination = buildPagination(result.total, page, perPage);
    return paginatedResponse(res, result.projects, pagination);
  } catch (error) {
    console.error('Get trashed projects error:', error);
    return errorResponse(res, 'Failed to retrieve trashed projects', 500);
  }
}
