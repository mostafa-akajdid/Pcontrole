import { ProjectService, ActivityService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, updateProjectSchema } from '@/lib/validation';
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
    const project = await ProjectService.findById(id);
    return successResponse(res, project);
  } catch (error) {
    console.error('Get project error:', error);
    if (error.message === 'Project not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to retrieve project', 500);
  }
}

async function handlePut(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('projects.update')) {
      return forbiddenResponse(res, 'Insufficient permissions to update projects');
    }

    const validation = validateRequest(updateProjectSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const oldProject = await ProjectService.findByIdOrThrow(id);
    const project = await ProjectService.update(id, validation.data, extractRequestMetadata(req, tokenPayload.userId));

    const changes = [];
    if (validation.data.title && validation.data.title !== oldProject.title) changes.push('title');
    if (validation.data.status && validation.data.status !== oldProject.status) changes.push('status');
    if (validation.data.featured !== undefined && validation.data.featured !== oldProject.featured) changes.push('featured');

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'UPDATED',
      entityType: 'Project',
      entityId: project.id,
      details: { title: project.title, changes },
    });

    return successResponse(res, project, 'Project updated successfully');
  } catch (error) {
    console.error('Update project error:', error);
    if (error.message === 'Project not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to update project', 400);
  }
}

async function handleDelete(req, res, id, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('projects.delete')) {
      return forbiddenResponse(res, 'Insufficient permissions to delete projects');
    }

    const result = await ProjectService.delete(id, extractRequestMetadata(req, tokenPayload.userId));

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'DELETED',
      entityType: 'Project',
      entityId: id,
      details: { title: result.title },
    });

    return successResponse(res, null, result.message);
  } catch (error) {
    console.error('Delete project error:', error);
    if (error.message === 'Project not found') {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message || 'Failed to delete project', 500);
  }
}
