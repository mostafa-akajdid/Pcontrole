import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, notFoundResponse, extractRequestMetadata } from '@/lib/api';
import { validateRequest, updateUserSchema } from '@/lib/validation';

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
    const requestingUser = await UserService.findById(tokenPayload.userId);
    if (!requestingUser.permissions?.includes('users.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const user = await UserService.findById(id);
    return successResponse(res, user);
  } catch (error) {
    console.error('Get user error:', error);
    if (error.message === 'User not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to get user', 500);
  }
}

async function handlePut(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('users.update')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    if (id === tokenPayload.userId) {
      return errorResponse(res, 'Cannot modify your own account via this endpoint', 400);
    }

    const validation = validateRequest(updateUserSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const updatedUser = await UserService.update(id, validation.data, extractRequestMetadata(req, tokenPayload.userId));
    return successResponse(res, updatedUser, 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    if (error.message === 'User not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to update user', 400);
  }
}

async function handleDelete(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('users.delete')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    if (id === tokenPayload.userId) {
      return errorResponse(res, 'Cannot delete your own account', 400);
    }

    await UserService.delete(id, extractRequestMetadata(req, tokenPayload.userId));
    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.message === 'User not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to delete user', 500);
  }
}
