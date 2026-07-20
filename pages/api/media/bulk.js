import { MediaService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, mediaBulkActionSchema } from '@/lib/validation';
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
    const { action } = req.body;

    if (action === 'permanentDelete') {
      if (!user.permissions?.includes('media.delete')) {
        return forbiddenResponse(res, 'Insufficient permissions to permanently delete media');
      }
    } else if (['delete', 'restore'].includes(action)) {
      if (!user.permissions?.includes('media.delete')) {
        return forbiddenResponse(res, `Insufficient permissions to ${action} media`);
      }
    } else {
      if (!user.permissions?.includes('media.update')) {
        return forbiddenResponse(res, `Insufficient permissions to ${action} media`);
      }
    }

    const validation = validateRequest(mediaBulkActionSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const { ids, action: validatedAction, folder, metadata } = validation.data;
    const result = await MediaService.bulkAction({ ids, action: validatedAction, folder, metadata: metadata }, extractRequestMetadata(req, tokenPayload.userId));

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: validatedAction.toUpperCase(),
      entityType: 'Media',
      entityId: ids.join(','),
      details: { count: result.count, ids, folder, metadata },
    });

    return successResponse(res, null, result.message);
  } catch (error) {
    console.error('Bulk action error:', error);
    return errorResponse(res, error.message || 'Bulk action failed', 400);
  }
}
