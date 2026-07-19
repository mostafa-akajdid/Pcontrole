import { RoleService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, notFoundResponse, extractRequestMetadata } from '@/lib/api';
import { validateRequest, cloneRoleSchema } from '@/lib/validation';

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
    if (!admin.permissions?.includes('roles.create')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const { id } = req.query;

    const validation = validateRequest(cloneRoleSchema, req.body || {});
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const clonedRole = await RoleService.clone(id, validation.data, extractRequestMetadata(req, tokenPayload.userId));
    return successResponse(res, clonedRole, 'Role cloned successfully', 201);
  } catch (error) {
    console.error('Clone role error:', error);
    if (error.message === 'Role not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to clone role', 500);
  }
}
