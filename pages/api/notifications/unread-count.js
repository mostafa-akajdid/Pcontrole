import { NotificationService } from '@/lib/services';
import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

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

  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  try {
    const [unreadCount, stats] = await Promise.all([
      NotificationService.getUnreadCount(tokenPayload.userId),
      NotificationService.getStats(tokenPayload.userId),
    ]);
    return successResponse(res, { unreadCount, stats });
  } catch (error) {
    console.error('Get notification stats error:', error);
    return errorResponse(res, error.message || 'Failed to get notification stats', 500);
  }
}
