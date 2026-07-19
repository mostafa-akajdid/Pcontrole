import { HeadlessApiKeyService, PublicApiService } from '@/lib/services';
import { errorResponse, notFoundResponse } from '@/lib/api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return errorResponse(res, 'Method not allowed', 405);
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

    const { slug } = req.query;

    if (!slug || typeof slug !== 'string') {
      return errorResponse(res, 'Project slug is required', 400);
    }

    const project = await PublicApiService.findPublishedProjectBySlug(slug);

    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    const ifNoneMatch = req.headers['if-none-match'];
    const etag = PublicApiService.generateETag(project);

    if (ifNoneMatch === etag) {
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.setHeader('ETag', etag);
      return res.status(304).end();
    }

    PublicApiService.setCacheHeaders(res, project);
    return res.status(200).json({ success: true, data: project, message: 'Success' });
  } catch (error) {
    console.error('Public project detail error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
