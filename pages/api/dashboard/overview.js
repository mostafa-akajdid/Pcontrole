import { DashboardService } from '@/lib/services';
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
    const overview = await DashboardService.getOverview();
    return successResponse(res, overview);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return errorResponse(res, error.message || 'Failed to get dashboard overview', 500);
  }
}
