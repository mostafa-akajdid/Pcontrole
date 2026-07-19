import { BlogService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, updateBlogSchema } from '@/lib/validation';
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
    const blog = await BlogService.findById(id);
    return successResponse(res, blog);
  } catch (error) {
    console.error('Get blog error:', error);
    if (error.message === 'Blog not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to retrieve blog', 500);
  }
}

async function handlePut(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('blogs.update')) {
      return forbiddenResponse(res, 'Insufficient permissions to update blogs');
    }

    const validation = validateRequest(updateBlogSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const oldBlog = await BlogService.findByIdOrThrow(id);
    const blog = await BlogService.update(id, validation.data, extractRequestMetadata(req, tokenPayload.userId));

    const changes = [];
    if (validation.data.title && validation.data.title !== oldBlog.title) changes.push('title');
    if (validation.data.status && validation.data.status !== oldBlog.status) changes.push('status');
    if (validation.data.featured !== undefined && validation.data.featured !== oldBlog.featured) changes.push('featured');

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'UPDATED',
      entityType: 'Blog',
      entityId: blog.id,
      details: { title: blog.title, changes },
    });

    return successResponse(res, blog, 'Blog updated successfully');
  } catch (error) {
    console.error('Update blog error:', error);
    if (error.message === 'Blog not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to update blog', 400);
  }
}

async function handleDelete(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('blogs.delete')) {
      return forbiddenResponse(res, 'Insufficient permissions to delete blogs');
    }

    const { restore } = req.query;

    if (restore === 'true') {
      const blog = await BlogService.restore(id, extractRequestMetadata(req, tokenPayload.userId));

      await ActivityService.log({
        userId: tokenPayload.userId,
        action: 'RESTORED',
        entityType: 'Blog',
        entityId: blog.id,
        details: { title: blog.title },
      });

      return successResponse(res, blog, 'Blog restored successfully');
    }

    const result = await BlogService.delete(id, extractRequestMetadata(req, tokenPayload.userId));

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'DELETED',
      entityType: 'Blog',
      entityId: id,
      details: { title: result.title },
    });

    return successResponse(res, null, result.message);
  } catch (error) {
    console.error('Delete blog error:', error);
    if (error.message === 'Blog not found' || error.message === 'Deleted blog not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to delete blog', 500);
  }
}
