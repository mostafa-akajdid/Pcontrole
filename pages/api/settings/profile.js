import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, updateUserSchema, changePasswordSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);
  
  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, tokenPayload);
    case 'PUT':
      return handlePut(req, res, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    return successResponse(res, user);
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, error.message || 'Failed to get profile', 500);
  }
}

async function handlePut(req, res, tokenPayload) {
  try {
    const { type } = req.query;
    
    if (type === 'password') {
      const validation = validateRequest(changePasswordSchema, req.body);
      if (!validation.success) {
        return errorResponse(res, 'Validation failed', 400, validation.errors);
      }
      
      await UserService.changePassword(tokenPayload.userId, validation.data);
      return successResponse(res, null, 'Password changed successfully');
    }
    
    // Update profile
    const validation = validateRequest(updateUserSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }
    
    const updatedUser = await UserService.update(tokenPayload.userId, validation.data);
    return successResponse(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, error.message || 'Failed to update profile', 400);
  }
}
