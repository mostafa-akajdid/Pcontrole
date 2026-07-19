import { BlogService } from '@/lib/services';
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
    const stats = await BlogService.getStats();
    return successResponse(res, stats);
  } catch (error) {
    console.error('Blog stats error:', error);
    return errorResponse(res, 'Failed to get blog stats', 500);
  }
}
