import { GlobalSearchService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  const { search } = req.query;

  if (!search || search.trim().length < 2) {
    return successResponse(res, { groups: {}, totalResults: 0, query: '' });
  }

  try {
    const results = await GlobalSearchService.search(search.trim(), tokenPayload);
    return successResponse(res, results);
  } catch (error) {
    console.error('Global search error:', error);
    return errorResponse(res, error.message || 'Search failed', 500);
  }
}
