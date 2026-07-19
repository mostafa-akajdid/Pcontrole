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
    const [stats, recentProjects, recentBlogs, recentActivity] = await Promise.all([
      DashboardService.getStats(),
      DashboardService.getRecentProjects(5),
      DashboardService.getRecentBlogs(5),
      DashboardService.getRecentActivity(10),
    ]);

    return successResponse(res, {
      stats,
      recentProjects,
      recentBlogs,
      recentActivity,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return errorResponse(res, error.message || 'Failed to get dashboard stats', 500);
  }
}
