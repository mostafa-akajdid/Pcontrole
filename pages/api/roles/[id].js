import { RoleService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, notFoundResponse, extractRequestMetadata } from '@/lib/api';
import { validateRequest, updateRoleSchema } from '@/lib/validation';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);
  
  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, id, tokenPayload);
    case 'PUT':
      return handlePut(req, res, id, tokenPayload);
    case 'DELETE':
      return handleDelete(req, res, id, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('roles.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const role = await RoleService.findById(id);
    return successResponse(res, role);
  } catch (error) {
    console.error('Get role error:', error);
    if (error.message === 'Role not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to get role', 500);
  }
}

async function handlePut(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('roles.update')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const validation = validateRequest(updateRoleSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const role = await RoleService.update(id, validation.data, extractRequestMetadata(req, tokenPayload.userId));
    return successResponse(res, role, 'Role updated successfully');
  } catch (error) {
    console.error('Update role error:', error);
    if (error.message === 'Role not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to update role', 400);
  }
}

async function handleDelete(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('roles.delete')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    await RoleService.delete(id, extractRequestMetadata(req, tokenPayload.userId));
    return successResponse(res, null, 'Role deleted successfully');
  } catch (error) {
    console.error('Delete role error:', error);
    if (error.message === 'Role not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to delete role', 400);
  }
}
