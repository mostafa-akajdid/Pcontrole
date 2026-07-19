import { ProjectService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, projectImageSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, id);
    case 'POST':
      return handlePost(req, res, id, tokenPayload);
    case 'DELETE':
      return handleDelete(req, res, id, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, projectId) {
  try {
    const project = await ProjectService.findById(projectId);
    return successResponse(res, project.images || []);
  } catch (error) {
    if (error.message === 'Project not found') {
      return notFoundResponse(res, error.message);
    }
    console.error('Get images error:', error);
    return errorResponse(res, 'Failed to retrieve images', 500);
  }
}

async function handlePost(req, res, projectId, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('projects.update')) {
      return forbiddenResponse(res, 'Insufficient permissions to manage project images');
    }

    const validation = validateRequest(projectImageSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const image = await ProjectService.addImage(projectId, validation.data);

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'IMAGE_ADDED',
      entityType: 'ProjectImage',
      entityId: image.id,
      details: { projectId, url: validation.data.url },
    });

    return successResponse(res, image, 'Image added successfully', 201);
  } catch (error) {
    console.error('Add image error:', error);
    if (error.message === 'Project not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to add image', 400);
  }
}

async function handleDelete(req, res, projectId, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('projects.update')) {
      return forbiddenResponse(res, 'Insufficient permissions to manage project images');
    }

    const { imageId } = req.query;
    if (!imageId) {
      return errorResponse(res, 'Image ID is required', 400);
    }

    const result = await ProjectService.removeImage(imageId, projectId);

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'IMAGE_REMOVED',
      entityType: 'ProjectImage',
      entityId: imageId,
      details: { projectId },
    });

    return successResponse(res, null, result.message);
  } catch (error) {
    console.error('Remove image error:', error);
    if (error.message === 'Image not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to remove image', 500);
  }
}
