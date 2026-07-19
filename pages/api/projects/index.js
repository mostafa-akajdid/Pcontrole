import { ProjectService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, createProjectSchema } from '@/lib/validation';
import { parsePagination, buildPagination, parseSearch } from '@/lib/pagination';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, paginatedResponse, extractRequestMetadata } from '@/lib/api';

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
    const { page, perPage } = parsePagination(req.query);
    const search = parseSearch(req.query);
    const { status, featured, categoryId, year, sort, order } = req.query;

    const result = await ProjectService.findAll({
      page,
      perPage,
      search,
      status: status || '',
      featured: featured === 'true' ? true : featured === 'false' ? false : null,
      categoryId: categoryId || '',
      year: year || null,
      sort: sort || 'createdAt',
      order: order || 'desc',
    });

    const pagination = buildPagination(result.total, page, perPage);
    return paginatedResponse(res, result.projects, pagination);
  } catch (error) {
    console.error('Get projects error:', error);
    return errorResponse(res, 'Failed to retrieve projects', 500);
  }
}

async function handlePost(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('projects.create')) {
      return forbiddenResponse(res, 'Insufficient permissions to create projects');
    }

    const validation = validateRequest(createProjectSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const project = await ProjectService.create({
      ...validation.data,
      authorId: tokenPayload.userId,
    }, extractRequestMetadata(req, tokenPayload.userId));

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'CREATED',
      entityType: 'Project',
      entityId: project.id,
      details: { title: project.title },
    });

    return successResponse(res, project, 'Project created successfully', 201);
  } catch (error) {
    console.error('Create project error:', error);
    return errorResponse(res, error.message || 'Failed to create project', 400);
  }
}
