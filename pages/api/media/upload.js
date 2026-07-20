import crypto from 'crypto';
import { MediaService, ActivityService, UserService, CloudinaryService, ImageOptimizationService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('media.create')) {
      return forbiddenResponse(res, 'Insufficient permissions to upload media');
    }

    const { file, altText, caption, folder } = req.body;

    if (!file) {
      return errorResponse(res, 'File data is required', 400);
    }

    const sanitizedFolder = (folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);

    let uploadResult;
    let originalFormat = null;
    let originalFileSize = null;

    if (file.startsWith('data:')) {
      const matches = file.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return errorResponse(res, 'Invalid data URI format', 400);
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      let buffer = Buffer.from(base64Data, 'base64');
      originalFileSize = buffer.length;

      const ext = mimeType.split('/')[1] || 'bin';
      const resourceType = mimeType.startsWith('video/') ? 'video' : mimeType.startsWith('image/') ? 'image' : 'raw';

      if (ImageOptimizationService.isImageMime(mimeType) && ImageOptimizationService.isOptimizable(mimeType)) {
        try {
          const optimized = await ImageOptimizationService.optimizeBuffer(buffer, mimeType);
          buffer = optimized.buffer;
          originalFormat = optimized.originalFormat;

          const optimizedMimeType = ImageOptimizationService.getMimeTypeForFormat(optimized.format);
          const optimizedExt = optimized.format;

          const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${optimizedExt}`;

          uploadResult = await CloudinaryService.uploadBuffer(buffer, {
            folder: `piolec/${sanitizedFolder}`,
            filename: fileName,
            resourceType: 'image',
          });
        } catch (optError) {
          console.warn('Optimization failed, uploading original:', optError.message);
          const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
          uploadResult = await CloudinaryService.uploadBuffer(buffer, {
            folder: `piolec/${sanitizedFolder}`,
            filename: fileName,
            resourceType,
          });
        }
      } else {
        const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
        uploadResult = await CloudinaryService.uploadBuffer(buffer, {
          folder: `piolec/${sanitizedFolder}`,
          filename: fileName,
          resourceType,
        });
      }
    } else if (file.startsWith('http')) {
      uploadResult = await CloudinaryService.uploadFromUrl(file, {
        folder: `piolec/${sanitizedFolder}`,
      });
    } else {
      return errorResponse(res, 'Invalid file format. Send a data URI or URL.', 400);
    }

    const media = await MediaService.create({
      fileName: uploadResult.originalFilename || `upload-${Date.now()}`,
      originalName: uploadResult.originalFilename || `upload-${Date.now()}`,
      publicId: uploadResult.publicId,
      url: uploadResult.url,
      secureUrl: uploadResult.url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      originalFormat,
      fileSize: uploadResult.bytes,
      originalFileSize,
      mimeType: uploadResult.mimeType || `${uploadResult.format === 'mp4' || uploadResult.format === 'webm' ? 'video' : 'image'}/${uploadResult.format || 'octet-stream'}`,
      altText,
      caption,
      folder: sanitizedFolder,
      uploadedById: tokenPayload.userId,
    });

    await ActivityService.log({
      userId: tokenPayload.userId,
      action: 'UPLOADED',
      entityType: 'Media',
      entityId: media.id,
      details: { fileName: media.fileName, folder: media.folder, format: media.format, originalFormat },
    });

    return successResponse(res, media, 'File uploaded successfully', 201);
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(res, error.message || 'Failed to upload file', 400);
  }
}
