import { AuthService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse } from '@/lib/api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  try {
    const tokenPayload = getUserFromRequest(req);
    
    if (!tokenPayload) {
      return unauthorizedResponse(res, 'Not authenticated');
    }

    const user = await AuthService.getMe(tokenPayload.userId);
    return successResponse(res, user);
  } catch (error) {
    console.error('Get me error:', error);
    return errorResponse(res, error.message || 'Failed to get user', 401);
  }
}
