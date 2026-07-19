import { NotificationService } from '@/lib/services';
import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';
import { parsePagination, buildPagination, parseSearch } from '@/lib/pagination';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  const user = await UserService.findById(tokenPayload.userId);
  if (!user) {
    return unauthorizedResponse(res);
  }

  if (user.status === 'SUSPENDED') {
    return forbiddenResponse(res);
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, tokenPayload);
    case 'DELETE':
      return handleDelete(req, res, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, user) {
  try {
    const { page, perPage, skip } = parsePagination(req.query);
    const search = parseSearch(req.query);
    const { type, priority, unreadOnly } = req.query;

    const result = await NotificationService.findAll({
      userId: user.userId,
      page,
      perPage,
      type: type || null,
      priority: priority || null,
      unreadOnly: unreadOnly === 'true',
      search,
    });

    const pagination = buildPagination(result.total, page, perPage);
    return successResponse(res, { items: result.items, pagination });
  } catch (error) {
    console.error('Get notifications error:', error);
    return errorResponse(res, error.message || 'Failed to get notifications', 500);
  }
}

async function handleDelete(req, res, user) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 'Notification IDs are required', 400);
    }

    await NotificationService.bulkDelete(ids, user.userId);
    return successResponse(res, null, 'Notifications deleted successfully');
  } catch (error) {
    console.error('Delete notifications error:', error);
    return errorResponse(res, error.message || 'Failed to delete notifications', 500);
  }
}
