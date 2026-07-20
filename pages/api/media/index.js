import { MediaService, ActivityService, UserService, CloudinaryService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, uploadMediaSchema } from '@/lib/validation';
import { parsePagination, buildPagination, parseSearch } from '@/lib/pagination';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, paginatedResponse, extractRequestMetadata } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res, tokenPayload);
    default:
      return methodNotAllowed(res);
  }
}

async function handleGet(req, res) {
  try {
    const { page, perPage } = parsePagination(req.query);
    const search = parseSearch(req.query);
    const { format, folder, sort, order } = req.query;

    const result = await MediaService.findAll({
      page,
      perPage,
      search,
      format: format || '',
      folder: folder || '',
      sort: sort || 'createdAt',
      order: order || 'desc',
    });

    const pagination = buildPagination(result.total, page, perPage);
    return paginatedResponse(res, result.media, pagination);
  } catch (error) {
    console.error('Get media error:', error);
    return errorResponse(res, 'Failed to retrieve media', 500);
  }
}

async function handlePost(req, res, tokenPayload) {
  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('media.create')) {
      return errorResponse(res, 'Insufficient permissions to upload media', 403);
    }

    const { url, altText, caption, folder } = req.body;

    if (!url) {
      return errorResponse(res, 'URL is required', 400);
    }

    const validation = validateRequest(uploadMediaSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const result = await CloudinaryService.uploadFromUrl(url, {
      folder: folder ? `piolec/${folder}` : 'piolec',
    });

    const media = await MediaService.create({
      fileName: result.originalFilename || url.split('/').pop() || 'upload',
      originalName: result.originalFilename || url.split('/').pop() || 'upload',
      publicId: result.publicId,
      url: result.url,
      secureUrl: result.url,
      width: result.width,
      height: result.height,
      format: result.format,
      fileSize: result.bytes,
      mimeType: result.mimeType || `${result.format === 'mp4' || result.format === 'webm' ? 'video' : 'image'}/${result.format || 'octet-stream'}`,
      altText,
      caption,
      folder: folder || 'general',
      uploadedById: tokenPayload.userId,
    }, extractRequestMetadata(req, tokenPayload.userId));

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'UPLOADED',
      entityType: 'Media',
      entityId: media.id,
      details: { fileName: media.fileName, folder: media.folder },
    });

    return successResponse(res, media, 'Media uploaded successfully', 201);
  } catch (error) {
    console.error('Upload media error:', error);
    return errorResponse(res, error.message || 'Failed to upload media', 400);
  }
}
