import { ProjectCategoryService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, createProjectCategorySchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';
import { parseSearch } from '@/lib/pagination';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res) {
  try {
    const search = parseSearch(req.query);

    let categories;
    if (search) {
      categories = await ProjectCategoryService.search(search);
    } else {
      categories = await ProjectCategoryService.findAll();
    }

    return successResponse(res, categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return errorResponse(res, 'Failed to retrieve categories', 500);
  }
}

async function handlePost(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('project-categories.create')) {
      return forbiddenResponse(res, 'Insufficient permissions to create categories');
    }

    const validation = validateRequest(createProjectCategorySchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const category = await ProjectCategoryService.create(validation.data);

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'CREATED',
      entityType: 'ProjectCategory',
      entityId: category.id,
      details: { name: category.name },
    });

    return successResponse(res, category, 'Category created successfully', 201);
  } catch (error) {
    console.error('Create category error:', error);
    return errorResponse(res, error.message || 'Failed to create category', 400);
  }
}
