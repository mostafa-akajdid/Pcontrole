import { SettingsService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, extractRequestMetadata } from '@/lib/api';

const VALID_GROUPS = ['general', 'branding', 'seo', 'contact', 'social', 'email', 'localization', 'security', 'maintenance', 'display'];

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, tokenPayload);
    case 'PUT':
      return handlePut(req, res, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('settings.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const { group, meta } = req.query;

    if (meta === 'true') {
      const settings = await SettingsService.getAllWithMeta(group || null);
      return successResponse(res, settings);
    }

    if (group) {
      if (!VALID_GROUPS.includes(group)) {
        return errorResponse(res, 'Invalid settings group', 400);
      }
      const settings = await SettingsService.getGroup(group);
      return successResponse(res, settings);
    }

    const settings = await SettingsService.getAll();
    return successResponse(res, settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return errorResponse(res, error.message || 'Failed to get settings', 500);
  }
}

async function handlePut(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('settings.update')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const { settings, group } = req.body;
    if (!settings || !Array.isArray(settings)) {
      return errorResponse(res, 'Invalid settings format', 400);
    }

    if (settings.length === 0) {
      return errorResponse(res, 'No settings to update', 400);
    }

    if (settings.length > 100) {
      return errorResponse(res, 'Too many settings', 400);
    }

    const invalidKeys = settings.filter((s) => !s.key || typeof s.key !== 'string' || s.key.length > 100);
    if (invalidKeys.length > 0) {
      return errorResponse(res, 'Invalid setting keys', 400);
    }

    const invalidValues = settings.filter((s) => typeof s.value !== 'string' || s.value.length > 10000);
    if (invalidValues.length > 0) {
      return errorResponse(res, 'Invalid setting values', 400);
    }

    if (group && !VALID_GROUPS.includes(group)) {
      return errorResponse(res, 'Invalid settings group', 400);
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || null;

    const metadata = extractRequestMetadata(req, tokenPayload.userId);

    let actorName = null;
    try {
      const { UserService } = await import('@/lib/services');
      const actor = await UserService.findById(tokenPayload.userId);
      actorName = actor?.name || null;
    } catch (e) {
      console.warn('Failed to look up actor name:', e);
    }

    if (group) {
      await SettingsService.updateGroup(group, settings, tokenPayload.userId, ipAddress, actorName);
    } else {
      await SettingsService.update(settings, tokenPayload.userId, ipAddress, actorName);
    }

    return successResponse(res, null, 'Settings updated successfully');
  } catch (error) {
    console.error('Update settings error:', error);
    return errorResponse(res, error.message || 'Failed to update settings', 500);
  }
}
