import { BlogService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, createBlogSchema } from '@/lib/validation';
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
    const { status, featured, categoryId, sort, order } = req.query;

    const result = await BlogService.findAll({
      page,
      perPage,
      search,
      status: status || '',
      featured: featured === 'true' ? true : featured === 'false' ? false : null,
      categoryId: categoryId || '',
      sort: sort || 'createdAt',
      order: order || 'desc',
    });

    const pagination = buildPagination(result.total, page, perPage);
    return paginatedResponse(res, result.blogs, pagination);
  } catch (error) {
    console.error('Get blogs error:', error);
    return errorResponse(res, 'Failed to retrieve blogs', 500);
  }
}

async function handlePost(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('blogs.create')) {
      return forbiddenResponse(res, 'Insufficient permissions to create blogs');
    }

    const validation = validateRequest(createBlogSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const blog = await BlogService.create({
      ...validation.data,
      authorId: tokenPayload.userId,
    }, extractRequestMetadata(req, tokenPayload.userId));

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'CREATED',
      entityType: 'Blog',
      entityId: blog.id,
      details: { title: blog.title },
    });

    return successResponse(res, blog, 'Blog created successfully', 201);
  } catch (error) {
    console.error('Create blog error:', error);
    return errorResponse(res, error.message || 'Failed to create blog', 400);
  }
}
