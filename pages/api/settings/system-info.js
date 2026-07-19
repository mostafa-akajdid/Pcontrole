import { SettingsService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('settings.system-info')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const systemInfo = await SettingsService.getSystemInfo();
    return successResponse(res, systemInfo);
  } catch (error) {
    console.error('Get system info error:', error);
    return errorResponse(res, error.message || 'Failed to get system info', 500);
  }
}
