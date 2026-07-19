import { ProjectService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, projectBulkActionSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, extractRequestMetadata } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const user = await UserService.findById(tokenPayload.userId);
    const requiredPerm = ['delete', 'restore', 'permanentDelete'].includes(req.body.action)
      ? 'projects.delete'
      : 'projects.update';

    if (!user.permissions?.includes(requiredPerm)) {
      return forbiddenResponse(res, `Insufficient permissions to ${req.body.action} projects`);
    }

    const validation = validateRequest(projectBulkActionSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const { ids, action } = validation.data;
    const result = await ProjectService.bulkAction({ ids, action }, extractRequestMetadata(req, tokenPayload.userId));

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: action.toUpperCase(),
      entityType: 'Project',
      entityId: ids.join(','),
      details: { count: result.count, ids },
    });

    return successResponse(res, null, result.message);
  } catch (error) {
    console.error('Bulk action error:', error);
    return errorResponse(res, error.message || 'Bulk action failed', 400);
  }
}
