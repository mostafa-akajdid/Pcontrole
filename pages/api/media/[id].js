import { MediaService, ActivityService, UserService, CloudinaryService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, updateMediaSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, notFoundResponse, forbiddenResponse, extractRequestMetadata } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, id);
    case 'PUT':
      return handlePut(req, res, id, tokenPayload);
    case 'DELETE':
      return handleDelete(req, res, id, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, id) {
  try {
    const media = await MediaService.findById(id);
    const usedIn = await MediaService.getUsedIn(media.id);
    return successResponse(res, { ...media, usedIn });
  } catch (error) {
    if (error.message === 'Media not found') {
      return notFoundResponse(res, error.message);
    }
    console.error('Get media error:', error);
    return errorResponse(res, 'Failed to retrieve media', 500);
  }
}

async function handlePut(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('media.update')) {
      return forbiddenResponse(res, 'Insufficient permissions to update media');
    }

    const validation = validateRequest(updateMediaSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const media = await MediaService.update(id, validation.data, extractRequestMetadata(req, tokenPayload.userId));

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'METADATA_UPDATED',
      entityType: 'Media',
      entityId: id,
      details: { fields: Object.keys(validation.data) },
    });

    return successResponse(res, media, 'Media updated successfully');
  } catch (error) {
    if (error.message === 'Media not found') {
      return notFoundResponse(res, error.message);
    }
    console.error('Update media error:', error);
    return errorResponse(res, error.message || 'Failed to update media', 400);
  }
}

async function handleDelete(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('media.delete')) {
      return forbiddenResponse(res, 'Insufficient permissions to delete media');
    }

    const media = await MediaService.findByIdOrThrow(id);

    await CloudinaryService.delete(media.publicId);

    const result = await MediaService.delete(id, extractRequestMetadata(req, tokenPayload.userId));

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'DELETED',
      entityType: 'Media',
      entityId: id,
      details: { fileName: media.fileName },
    });

    return successResponse(res, null, result.message);
  } catch (error) {
    if (error.message === 'Media not found') {
      return notFoundResponse(res, error.message);
    }
    console.error('Delete media error:', error);
    return errorResponse(res, error.message || 'Failed to delete media', 500);
  }
}
