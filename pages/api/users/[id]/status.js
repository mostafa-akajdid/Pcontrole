import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, notFoundResponse, extractRequestMetadata } from '@/lib/api';
import { validateRequest, userStatusSchema } from '@/lib/validation';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'PUT') {
    return methodNotAllowed(res);
  }

  try {
    const admin = await UserService.findById(tokenPayload.userId);
    if (!admin.permissions?.includes('users.update')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const { id } = req.query;

    if (id === tokenPayload.userId) {
      return errorResponse(res, 'Cannot change your own status', 400);
    }

    const validation = validateRequest(userStatusSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const user = await UserService.updateStatus(id, validation.data.status, extractRequestMetadata(req, tokenPayload.userId));
    return successResponse(res, user, 'User status updated successfully');
  } catch (error) {
    console.error('Update user status error:', error);
    if (error.message === 'User not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to update user status', 500);
  }
}
