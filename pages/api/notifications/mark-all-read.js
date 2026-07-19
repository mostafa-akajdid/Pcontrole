import { NotificationService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method === 'POST') {
    return handleMarkAll(req, res, tokenPayload);
  }

  return methodNotAllowed(res);
}

async function handleMarkAll(req, res, user) {
  try {
    await NotificationService.markAllAsRead(user.userId);
    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    console.error('Mark all read error:', error);
    return errorResponse(res, error.message || 'Failed to mark all as read', 500);
  }
}
