import { BlogCategoryService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, updateBlogCategorySchema } from '@/lib/validation';
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
    case 'PUT':
    case 'PATCH':
      return handlePut(req, res, id, tokenPayload);
    case 'DELETE':
      return handleDelete(req, res, id, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, id) {
  try {
    const category = await BlogCategoryService.findById(id);
    return successResponse(res, category);
  } catch (error) {
    if (error.message === 'Category not found') {
      return notFoundResponse(res, error.message);
    }
    console.error('Get blog category error:', error);
    return errorResponse(res, 'Failed to retrieve category', 500);
  }
}

async function handlePut(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('blog-categories.update')) {
      return forbiddenResponse(res, 'Insufficient permissions to update categories');
    }

    const validation = validateRequest(updateBlogCategorySchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const category = await BlogCategoryService.update(id, validation.data);

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'UPDATED',
      entityType: 'BlogCategory',
      entityId: category.id,
      details: { name: category.name },
    });

    return successResponse(res, category, 'Category updated successfully');
  } catch (error) {
    console.error('Update blog category error:', error);
    if (error.message === 'Category not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to update category', 400);
  }
}

async function handleDelete(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('blog-categories.delete')) {
      return forbiddenResponse(res, 'Insufficient permissions to delete categories');
    }

    const { restore } = req.query;

    if (restore === 'true') {
      const category = await BlogCategoryService.restore(id);

      await ActivityService.log({
        userId: tokenPayload.userId,
        action: 'RESTORED',
        entityType: 'BlogCategory',
        entityId: category.id,
        details: { name: category.name },
      });

      return successResponse(res, category, 'Category restored successfully');
    }

    const existingCategory = await BlogCategoryService.findById(id);
    const result = await BlogCategoryService.delete(id);

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'DELETED',
      entityType: 'BlogCategory',
      entityId: id,
      details: { name: existingCategory.name },
    });

    return successResponse(res, null, result.message);
  } catch (error) {
    console.error('Delete blog category error:', error);
    if (error.message === 'Category not found' || error.message === 'Deleted category not found') {
      return notFoundResponse(res, error.message);
    }
    if (error.message.includes('cannot be deleted')) {
      return errorResponse(res, error.message, 409);
    }
    return errorResponse(res, error.message || 'Failed to delete category', 500);
  }
}
