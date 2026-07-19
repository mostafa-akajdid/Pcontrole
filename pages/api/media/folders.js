import { MediaService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  try {
    const folders = await MediaService.getFolders();
    return successResponse(res, folders);
  } catch (error) {
    console.error('Get folders error:', error);
    return errorResponse(res, 'Failed to retrieve folders', 500);
  }
}
