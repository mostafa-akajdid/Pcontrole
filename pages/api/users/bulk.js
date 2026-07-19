import { UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';
import { validateRequest, userBulkActionSchema } from '@/lib/validation';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const admin = await UserService.findById(tokenPayload.userId);

    const validation = validateRequest(userBulkActionSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const { ids, action } = validation.data;

    if (['activate', 'deactivate', 'suspend'].includes(action)) {
      if (!admin.permissions?.includes('users.update')) {
        return forbiddenResponse(res, 'Insufficient permissions');
      }
    } else if (action === 'delete') {
      if (!admin.permissions?.includes('users.delete')) {
        return forbiddenResponse(res, 'Insufficient permissions');
      }
    } else if (action === 'restore') {
      if (!admin.permissions?.includes('users.restore')) {
        return forbiddenResponse(res, 'Insufficient permissions');
      }
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const id of ids) {
      try {
        if (id === tokenPayload.userId) {
          results.failed++;
          results.errors.push({ id, error: 'Cannot modify your own account' });
          continue;
        }

        switch (action) {
          case 'activate':
            await UserService.updateStatus(id, 'ACTIVE');
            results.success++;
            break;
          case 'deactivate':
            await UserService.updateStatus(id, 'INACTIVE');
            results.success++;
            break;
          case 'suspend':
            await UserService.updateStatus(id, 'SUSPENDED');
            results.success++;
            break;
          case 'delete':
            await UserService.delete(id);
            results.success++;
            break;
          case 'restore':
            await UserService.restore(id);
            results.success++;
            break;
          default:
            results.failed++;
            results.errors.push({ id, error: 'Unknown action' });
        }
      } catch (err) {
        results.failed++;
        results.errors.push({ id, error: err.message });
      }
    }

    return successResponse(res, results, `Bulk action completed: ${results.success} succeeded, ${results.failed} failed`);
  } catch (error) {
    console.error('Bulk user action error:', error);
    return errorResponse(res, error.message || 'Failed to perform bulk action', 500);
  }
}
