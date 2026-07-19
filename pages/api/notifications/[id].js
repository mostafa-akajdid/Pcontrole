import { NotificationService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, tokenPayload, id);
    case 'PATCH':
      return handlePatch(req, res, tokenPayload, id);
    case 'DELETE':
      return handleDelete(req, res, tokenPayload, id);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, user, id) {
  try {
    const notification = await NotificationService.findById(id, user.userId);
    if (!notification) {
      return notFoundResponse(res, 'Notification not found');
    }
    return successResponse(res, notification);
  } catch (error) {
    console.error('Get notification error:', error);
    return errorResponse(res, error.message || 'Failed to get notification', 500);
  }
}

async function handlePatch(req, res, user, id) {
  try {
    const { action } = req.body;

    if (action === 'read') {
      await NotificationService.markAsRead(id, user.userId);
      return successResponse(res, null, 'Notification marked as read');
    }

    return errorResponse(res, 'Invalid action', 400);
  } catch (error) {
    console.error('Update notification error:', error);
    return errorResponse(res, error.message || 'Failed to update notification', 500);
  }
}

async function handleDelete(req, res, user, id) {
  try {
    await NotificationService.delete(id, user.userId);
    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    console.error('Delete notification error:', error);
    return errorResponse(res, error.message || 'Failed to delete notification', 500);
  }
}
