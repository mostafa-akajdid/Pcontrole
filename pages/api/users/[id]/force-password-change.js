import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api';
import { validateRequest, forcePasswordChangeSchema } from '@/lib/validation';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const admin = await UserService.findById(tokenPayload.userId);
    if (!admin.permissions?.includes('users.manage')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const { id } = req.query;

    if (id === tokenPayload.userId) {
      return errorResponse(res, 'Cannot force password change on your own account', 400);
    }

    const validation = validateRequest(forcePasswordChangeSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const result = await UserService.forcePasswordChange(id, validation.data.enabled);
    return successResponse(res, result, result.message);
  } catch (error) {
    console.error('Force password change error:', error);
    if (error.message === 'User not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to force password change', 500);
  }
}
