import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api';
import { validateRequest, adminResetPasswordSchema } from '@/lib/validation';

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
      return errorResponse(res, 'Cannot reset your own password via this endpoint', 400);
    }

    const validation = validateRequest(adminResetPasswordSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const result = await UserService.adminResetPassword(id, validation.data);
    return successResponse(res, result, result.message);
  } catch (error) {
    console.error('Admin reset password error:', error);
    if (error.message === 'User not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to reset password', 500);
  }
}
