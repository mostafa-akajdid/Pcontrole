import { MediaService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { parsePagination, buildPagination, parseSearch } from '@/lib/pagination';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse, paginatedResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('media.read')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const { page, perPage } = parsePagination({ ...req.query, perPage: req.query.perPage || '24' });
    const search = parseSearch(req.query);
    const { format, folder } = req.query;

    const result = await MediaService.findAll({
      page,
      perPage,
      search,
      format: format || '',
      folder: folder || '',
      sort: 'createdAt',
      order: 'desc',
    });

    const items = result.media.map((m) => ({
      id: m.id,
      fileName: m.fileName,
      url: m.url,
      secureUrl: m.secureUrl,
      publicId: m.publicId,
      format: m.format,
      width: m.width,
      height: m.height,
      fileSize: m.fileSize,
      altText: m.altText,
      caption: m.caption,
      folder: m.folder,
      createdAt: m.createdAt,
    }));

    const pagination = buildPagination(result.total, page, perPage);
    return paginatedResponse(res, items, pagination);
  } catch (error) {
    console.error('Media picker error:', error);
    return errorResponse(res, 'Failed to load media', 500);
  }
}
