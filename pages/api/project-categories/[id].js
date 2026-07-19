import { ProjectCategoryService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, updateProjectCategorySchema } from '@/lib/validation';
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
    const category = await ProjectCategoryService.findById(id);
    return successResponse(res, category);
  } catch (error) {
    if (error.message === 'Category not found') {
      return notFoundResponse(res, error.message);
    }
    console.error('Get category error:', error);
    return errorResponse(res, 'Failed to retrieve category', 500);
  }
}

async function handlePut(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('project-categories.update')) {
      return forbiddenResponse(res, 'Insufficient permissions to update categories');
    }

    const validation = validateRequest(updateProjectCategorySchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const category = await ProjectCategoryService.update(id, validation.data);

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'UPDATED',
      entityType: 'ProjectCategory',
      entityId: category.id,
      details: { name: category.name },
    });

    return successResponse(res, category, 'Category updated successfully');
  } catch (error) {
    console.error('Update category error:', error);
    if (error.message === 'Category not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to update category', 400);
  }
}

async function handleDelete(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('project-categories.delete')) {
      return forbiddenResponse(res, 'Insufficient permissions to delete categories');
    }

    const { restore } = req.query;

    if (restore === 'true') {
      const category = await ProjectCategoryService.restore(id);

      await ActivityService.log({
        userId: tokenPayload.userId,
        action: 'RESTORED',
        entityType: 'ProjectCategory',
        entityId: category.id,
        details: { name: category.name },
      });

      return successResponse(res, category, 'Category restored successfully');
    }

    const existingCategory = await ProjectCategoryService.findById(id);
    const result = await ProjectCategoryService.delete(id);

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'DELETED',
      entityType: 'ProjectCategory',
      entityId: id,
      details: { name: existingCategory.name },
    });

    return successResponse(res, null, result.message);
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.message === 'Category not found' || error.message === 'Deleted category not found') {
      return notFoundResponse(res, error.message);
    }
    if (error.message.includes('cannot be deleted')) {
      return errorResponse(res, error.message, 409);
    }
    return errorResponse(res, error.message || 'Failed to delete category', 500);
  }
}
