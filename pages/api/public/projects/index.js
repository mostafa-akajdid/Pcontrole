import { HeadlessApiKeyService, PublicApiService } from '@/lib/services';
import { errorResponse, methodNotAllowed } from '@/lib/api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return errorResponse(res, 'API key is required', 401);
    }

    const validation = await HeadlessApiKeyService.validateApiKey(apiKey, 'projects');
    if (!validation.valid) {
      if (validation.reason === 'disabled') {
        return errorResponse(res, 'API access is disabled for this key', 403);
      }
      if (validation.reason === 'module_not_allowed') {
        return errorResponse(res, 'Projects module is not enabled for this API key', 403);
      }
      return errorResponse(res, 'Invalid API key', 401);
    }

    const { page = 1, limit = 12, search = '', category = '', year, sort = 'publishedAt', order = 'desc' } = req.query;

    const result = await PublicApiService.findPublishedProjects({
      page: parseInt(page) || 1,
      limit: Math.min(100, Math.max(1, parseInt(limit) || 12)),
      search: search || '',
      category: category || '',
      year: year || null,
      sort: sort || 'publishedAt',
      order: order || 'desc',
    });

    const responseData = {
      items: result.projects,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };

    const ifNoneMatch = req.headers['if-none-match'];
    const etag = PublicApiService.generateETag(responseData);

    if (ifNoneMatch === etag) {
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.setHeader('ETag', etag);
      return res.status(304).end();
    }

    PublicApiService.setCacheHeaders(res, responseData);
    return res.status(200).json({ success: true, data: responseData, message: 'Success' });
  } catch (error) {
    console.error('Public projects list error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
