import { RoleService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, extractRequestMetadata } from '@/lib/api';
import { validateRequest, createRoleSchema } from '@/lib/validation';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);
  
  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, tokenPayload);
    case 'POST':
      return handlePost(req, res, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('roles.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const roles = await RoleService.findAll();
    return successResponse(res, roles);
  } catch (error) {
    console.error('Get roles error:', error);
    return errorResponse(res, error.message || 'Failed to get roles', 500);
  }
}

async function handlePost(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('roles.create')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const validation = validateRequest(createRoleSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const role = await RoleService.create(validation.data, extractRequestMetadata(req, tokenPayload.userId));
    return successResponse(res, role, 'Role created successfully', 201);
  } catch (error) {
    console.error('Create role error:', error);
    return errorResponse(res, error.message || 'Failed to create role', 400);
  }
}
