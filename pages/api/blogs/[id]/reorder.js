import { BlogService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, reorderImagesSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'PUT') {
    return methodNotAllowed(res);
  }

  const { id } = req.query;

  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('blogs.update')) {
      return forbiddenResponse(res, 'Insufficient permissions to reorder blog images');
    }

    const validation = validateRequest(reorderImagesSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const result = await BlogService.reorderImages(id, validation.data.imageIds);
    return successResponse(res, null, result.message);
  } catch (error) {
    console.error('Reorder images error:', error);
    return errorResponse(res, error.message || 'Failed to reorder images', 500);
  }
}
