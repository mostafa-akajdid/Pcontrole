import { MediaService } from '@/lib/services';
import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  const user = await UserService.findById(tokenPayload.userId);
  if (!user || !user.permissions?.includes('media.read')) {
    return forbiddenResponse(res);
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  try {
    const [stats, folders, formats] = await Promise.all([
      MediaService.getStats(),
      MediaService.getFolders(),
      MediaService.getFormats(),
    ]);

    return successResponse(res, { stats, folders, formats });
  } catch (error) {
    console.error('Media stats error:', error);
    return errorResponse(res, error.message || 'Failed to get media stats', 500);
  }
}
