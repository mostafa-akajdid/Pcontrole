import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, paginatedResponse, unauthorizedResponse, forbiddenResponse, extractRequestMetadata } from '@/lib/api';
import { validateRequest, createUserSchema } from '@/lib/validation';
import { buildPagination } from '@/lib/pagination';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);
  
  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, tokenPayload);
    case 'POST':
      return handlePost(req, res, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('users.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const { page, perPage, search, status, roleId, sort, order } = req.query;
    
    const result = await UserService.findAll({
      page: parseInt(page) || 1,
      perPage: parseInt(perPage) || 10,
      search: search || '',
      status: status || '',
      roleId: roleId || '',
      sort: sort || 'createdAt',
      order: order || 'desc',
    });

    const pagination = buildPagination(result.total, parseInt(page) || 1, parseInt(perPage) || 10);
    return paginatedResponse(res, result.users, pagination);
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse(res, error.message || 'Failed to get users', 500);
  }
}

async function handlePost(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('users.create')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const validation = validateRequest(createUserSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const newUser = await UserService.create(validation.data, extractRequestMetadata(req, tokenPayload.userId));
    return successResponse(res, newUser, 'User created successfully', 201);
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(res, error.message || 'Failed to create user', 400);
  }
}
