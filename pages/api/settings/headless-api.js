import { HeadlessApiKeyService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import {
  successResponse, errorResponse, methodNotAllowed,
  unauthorizedResponse, forbiddenResponse, extractRequestMetadata,
} from '@/lib/api';
import { validateRequest } from '@/lib/validation';
import { z } from 'zod';

const createApiKeySchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(100),
  domain: z.string().min(1, 'Domain is required').max(200),
  enabled: z.boolean().optional(),
  allowedModules: z.array(z.string()).optional(),
});

const updateApiKeySchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  domain: z.string().min(1).max(200).optional(),
  enabled: z.boolean().optional(),
  allowedModules: z.array(z.string()).optional(),
});

const regenerateSchema = z.object({
  id: z.string().min(1, 'API key ID is required'),
});

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
    case 'PUT':
      return handlePut(req, res, tokenPayload);
    case 'DELETE':
      return handleDelete(req, res, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('headless.view')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const { id } = req.query;

    if (id) {
      const key = await HeadlessApiKeyService.findById(id);
      return successResponse(res, key);
    }

    const keys = await HeadlessApiKeyService.findAll();
    return successResponse(res, keys);
  } catch (error) {
    console.error('Get headless API keys error:', error);
    return errorResponse(res, error.message || 'Failed to get API keys', 500);
  }
}

async function handlePost(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('headless.create')) {
      return forbiddenResponse(res, 'Insufficient permissions to create API keys');
    }

    const validation = validateRequest(createApiKeySchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const metadata = extractRequestMetadata(req, tokenPayload.userId);
    const key = await HeadlessApiKeyService.create(validation.data, metadata);

    return successResponse(res, key, 'API key created successfully', 201);
  } catch (error) {
    console.error('Create headless API key error:', error);
    return errorResponse(res, error.message || 'Failed to create API key', 500);
  }
}

async function handlePut(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);

    const { action, ...bodyData } = req.body;

    if (action === 'regenerate') {
      if (!user.permissions?.includes('headless.regenerate')) {
        return forbiddenResponse(res, 'Insufficient permissions to regenerate API keys');
      }

      const validation = validateRequest(regenerateSchema, bodyData);
      if (!validation.success) {
        return errorResponse(res, 'Validation failed', 400, validation.errors);
      }

      const metadata = extractRequestMetadata(req, tokenPayload.userId);
      const key = await HeadlessApiKeyService.regenerateKey(bodyData.id, metadata);

      return successResponse(res, key, 'API key regenerated successfully');
    }

    if (action === 'toggle') {
      if (!user.permissions?.includes('headless.update')) {
        return forbiddenResponse(res, 'Insufficient permissions to update API keys');
      }

      const validation = validateRequest(z.object({ id: z.string().min(1) }), bodyData);
      if (!validation.success) {
        return errorResponse(res, 'Validation failed', 400, validation.errors);
      }

      const metadata = extractRequestMetadata(req, tokenPayload.userId);
      const key = await HeadlessApiKeyService.toggleEnabled(bodyData.id, metadata);

      return successResponse(res, key, `API key ${key.enabled ? 'enabled' : 'disabled'} successfully`);
    }

    if (!user.permissions?.includes('headless.update')) {
      return forbiddenResponse(res, 'Insufficient permissions to update API keys');
    }

    const { id, ...updateData } = req.body;

    if (!id) {
      return errorResponse(res, 'API key ID is required', 400);
    }

    const validation = validateRequest(updateApiKeySchema, updateData);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const metadata = extractRequestMetadata(req, tokenPayload.userId);
    const key = await HeadlessApiKeyService.update(id, validation.data, metadata);

    return successResponse(res, key, 'API key updated successfully');
  } catch (error) {
    console.error('Update headless API key error:', error);
    return errorResponse(res, error.message || 'Failed to update API key', 500);
  }
}

async function handleDelete(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('headless.delete')) {
      return forbiddenResponse(res, 'Insufficient permissions to delete API keys');
    }

    const { id } = req.query;

    if (!id) {
      return errorResponse(res, 'API key ID is required', 400);
    }

    const metadata = extractRequestMetadata(req, tokenPayload.userId);
    const result = await HeadlessApiKeyService.delete(id, metadata);

    return successResponse(res, result, result.message);
  } catch (error) {
    console.error('Delete headless API key error:', error);
    return errorResponse(res, error.message || 'Failed to delete API key', 500);
  }
}
