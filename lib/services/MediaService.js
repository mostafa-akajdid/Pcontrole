import prisma from '@/lib/prisma';
import { EventService } from './EventService';
import { CloudinaryService } from './CloudinaryService';

const TRASH_RETENTION_DAYS = 30;

export class MediaService {
  static async findAll({
    page = 1,
    perPage = 24,
    search = '',
    format = '',
    folder = '',
    sort = 'createdAt',
    order = 'desc',
    includeDeleted = false,
    onlyDeleted = false,
  } = {}) {
    const where = onlyDeleted
      ? { deletedAt: { not: null } }
      : includeDeleted
        ? {}
        : { deletedAt: null };

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } },
        { folder: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { format: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (format) {
      where.format = format;
    }

    if (folder) {
      where.folder = folder;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'fileName', 'fileSize', 'format'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * perPage;

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, name: true, avatar: true } },
        },
        skip,
        take: perPage,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.media.count({ where }),
    ]);

    return { media, total };
  }

  static async findById(id) {
    const media = await prisma.media.findFirst({
      where: { id, deletedAt: null },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    return media;
  }

  static async findByIdOrThrow(id) {
    const media = await prisma.media.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, fileName: true, publicId: true, url: true, uploadedById: true },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    return media;
  }

  static async findByIdForTrash(id) {
    const media = await prisma.media.findFirst({
      where: { id, deletedAt: { not: null } },
      select: { id: true, fileName: true, publicId: true, url: true, uploadedById: true },
    });

    if (!media) {
      throw new Error('Trashed media not found');
    }

    return media;
  }

  static async create({
    fileName,
    originalName,
    publicId,
    url,
    secureUrl,
    width,
    height,
    format,
    originalFormat,
    fileSize,
    originalFileSize,
    mimeType,
    altText,
    caption,
    folder,
    uploadedById,
  }, metadata = {}) {
    const media = await prisma.media.create({
      data: {
        fileName: fileName.trim(),
        originalName: originalName.trim(),
        publicId,
        url,
        secureUrl: secureUrl || url,
        width: width || null,
        height: height || null,
        format,
        originalFormat: originalFormat || null,
        fileSize,
        originalFileSize: originalFileSize || null,
        mimeType,
        altText: altText || null,
        caption: caption || null,
        folder: folder || 'general',
        uploadedById,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    EventService.emit('media.uploaded', {
      actorId: metadata.actorId || uploadedById,
      entityId: media.id,
      entityName: media.fileName,
      format: media.format,
      fileSize: media.fileSize,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return media;
  }

  static async update(id, data, metadata = {}) {
    await this.findByIdOrThrow(id);

    const updateData = {};
    if (data.altText !== undefined) updateData.altText = data.altText || null;
    if (data.caption !== undefined) updateData.caption = data.caption || null;
    if (data.fileName !== undefined) updateData.fileName = data.fileName.trim();
    if (data.folder !== undefined) updateData.folder = data.folder.trim();

    const updated = await prisma.media.update({
      where: { id },
      data: updateData,
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    EventService.emit('media.updated', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: updated.fileName,
      oldValues: data,
      newValues: updateData,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return updated;
  }

  static async delete(id, metadata = {}) {
    const media = await prisma.media.findFirst({ where: { id, deletedAt: null }, select: { id: true, fileName: true } });

    if (!media) {
      throw new Error('Media not found');
    }

    await prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    EventService.emit('media.trashed', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: media.fileName,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return { message: 'Media moved to trash' };
  }

  static async permanentDelete(id, metadata = {}) {
    const media = await prisma.media.findFirst({
      where: { id },
      select: { id: true, fileName: true, publicId: true },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    let cloudinaryResult = null;
    try {
      cloudinaryResult = await CloudinaryService.deleteWithDerived(media.publicId);
    } catch (error) {
      console.error(`Cloudinary deletion failed for ${media.publicId}:`, error.message);
    }

    await prisma.media.delete({ where: { id } });

    EventService.emit('media.permanently_deleted', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: media.fileName,
      cloudinaryDeleted: !!cloudinaryResult,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return { message: 'Media permanently deleted', cloudinaryDeleted: !!cloudinaryResult };
  }

  static async restore(id) {
    const media = await prisma.media.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!media) {
      throw new Error('Deleted media not found');
    }

    return prisma.media.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  static async getStats() {
    const [total, images, videos, documents, totalSize, trashCount, avgSizeResult, webpCount] = await Promise.all([
      prisma.media.count({ where: { deletedAt: null } }),
      prisma.media.count({ where: { deletedAt: null, format: { in: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'] } } }),
      prisma.media.count({ where: { deletedAt: null, format: { in: ['mp4', 'webm', 'mov', 'avi'] } } }),
      prisma.media.count({ where: { deletedAt: null, format: { in: ['pdf', 'doc', 'docx', 'txt'] } } }),
      prisma.media.aggregate({ where: { deletedAt: null }, _sum: { fileSize: true } }),
      prisma.media.count({ where: { deletedAt: { not: null } } }),
      prisma.media.aggregate({ where: { deletedAt: null }, _avg: { fileSize: true } }),
      prisma.media.count({ where: { deletedAt: null, format: 'webp' } }),
    ]);

    return {
      total,
      images,
      videos,
      documents,
      totalSize: totalSize._sum.fileSize || 0,
      trashCount,
      averageFileSize: Math.round(avgSizeResult._avg.fileSize || 0),
      webpCount,
    };
  }

  static async getTrashStats() {
    const [count, totalSize] = await Promise.all([
      prisma.media.count({ where: { deletedAt: { not: null } } }),
      prisma.media.aggregate({ where: { deletedAt: { not: null } }, _sum: { fileSize: true } }),
    ]);

    return {
      count,
      totalSize: totalSize._sum.fileSize || 0,
    };
  }

  static async getFolders() {
    const folders = await prisma.media.groupBy({
      by: ['folder'],
      where: { deletedAt: null },
      _count: { folder: true },
      orderBy: { folder: 'asc' },
    });

    return folders.map((f) => ({ name: f.folder, count: f._count.folder }));
  }

  static async getFormats() {
    const formats = await prisma.media.groupBy({
      by: ['format'],
      where: { deletedAt: null },
      _count: { format: true },
      orderBy: { format: 'asc' },
    });

    return formats.map((f) => ({ name: f.format, count: f._count.format }));
  }

  static async findUnused() {
    const allMedia = await prisma.media.findMany({
      where: { deletedAt: null },
      select: { id: true, url: true, secureUrl: true, fileName: true, format: true, fileSize: true, createdAt: true },
    });

    const unused = [];

    for (const item of allMedia) {
      const usages = await this.getUsedIn(item.id);
      if (usages.length === 0) {
        unused.push({ ...item, usageCount: 0 });
      }
    }

    return unused;
  }

  static async bulkAction({ ids, action, folder, metadata: bulkMetadata }, metadata = {}) {
    if (!ids || ids.length === 0) {
      throw new Error('No media selected');
    }

    const where = { id: { in: ids } };

    switch (action) {
      case 'delete': {
        const result = await prisma.media.updateMany({
          where: { ...where, deletedAt: null },
          data: { deletedAt: new Date() },
        });
        EventService.emit('media.bulk_action', {
          actorId: metadata.actorId,
          action: 'trash',
          count: result.count,
          entityIds: ids,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }).catch(EventService.logError);
        return { message: `${result.count} file(s) moved to trash`, count: result.count };
      }

      case 'permanentDelete': {
        const mediaItems = await prisma.media.findMany({
          where: { id: { in: ids } },
          select: { id: true, publicId: true, fileName: true },
        });

        const publicIds = mediaItems.map((m) => m.publicId);

        if (publicIds.length > 0) {
          try {
            await CloudinaryService.deleteMultiple(publicIds);
          } catch (error) {
            console.error('Cloudinary bulk delete failed:', error.message);
          }
        }

        const result = await prisma.media.deleteMany({ where: { id: { in: ids } } });

        EventService.emit('media.bulk_action', {
          actorId: metadata.actorId,
          action: 'permanentDelete',
          count: result.count,
          entityIds: ids,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }).catch(EventService.logError);

        return { message: `${result.count} file(s) permanently deleted`, count: result.count };
      }

      case 'restore': {
        const result = await prisma.media.updateMany({
          where: { ...where, deletedAt: { not: null } },
          data: { deletedAt: null },
        });
        return { message: `${result.count} file(s) restored`, count: result.count };
      }

      case 'move': {
        if (!folder) throw new Error('Folder name is required');
        const result = await prisma.media.updateMany({
          where: { ...where, deletedAt: null },
          data: { folder: folder.trim() },
        });
        return { message: `${result.count} file(s) moved to ${folder}`, count: result.count };
      }

      case 'updateAltText': {
        const result = await prisma.media.updateMany({
          where: { ...where, deletedAt: null },
          data: { altText: metadata?.altText || null },
        });
        return { message: `${result.count} file(s) updated`, count: result.count };
      }

      case 'updateCaption': {
        const result = await prisma.media.updateMany({
          where: { ...where, deletedAt: null },
          data: { caption: metadata?.caption || null },
        });
        return { message: `${result.count} file(s) updated`, count: result.count };
      }

      default:
        throw new Error('Invalid action');
    }
  }

  static async cleanupTrash() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - TRASH_RETENTION_DAYS);

    const expiredItems = await prisma.media.findMany({
      where: { deletedAt: { not: null, lt: cutoffDate } },
      select: { id: true, publicId: true, fileName: true },
    });

    if (expiredItems.length === 0) {
      return { deleted: 0, errors: [] };
    }

    const publicIds = expiredItems.map((item) => item.publicId);
    const errors = [];

    try {
      await CloudinaryService.deleteMultiple(publicIds);
    } catch (error) {
      console.error('Cloudinary cleanup failed:', error.message);
      errors.push(`Cloudinary: ${error.message}`);
    }

    const result = await prisma.media.deleteMany({
      where: { deletedAt: { not: null, lt: cutoffDate } },
    });

    EventService.emit('media.trash_cleanup', {
      count: result.count,
      errors: errors.length > 0 ? errors : undefined,
    }).catch(EventService.logError);

    return { deleted: result.count, errors };
  }

  static async getUsedIn(mediaId) {
    const usages = [];
    const media = await prisma.media.findFirst({ where: { id: mediaId, deletedAt: null }, select: { url: true, secureUrl: true } });
    if (!media) return usages;

    const mediaUrl = media.url;
    const mediaSecureUrl = media.secureUrl;

    const projectImages = await prisma.projectImage.findMany({
      where: { OR: [{ publicId: mediaId }, { url: mediaUrl }, { url: mediaSecureUrl }] },
      select: {
        id: true,
        project: { select: { id: true, title: true } },
      },
    });

    for (const img of projectImages) {
      usages.push({
        type: 'project',
        id: img.project.id,
        title: img.project.title,
        field: 'gallery',
      });
    }

    const blogImages = await prisma.blogImage.findMany({
      where: { OR: [{ publicId: mediaId }, { url: mediaUrl }, { url: mediaSecureUrl }] },
      select: {
        id: true,
        blog: { select: { id: true, title: true } },
      },
    });

    for (const img of blogImages) {
      usages.push({
        type: 'blog',
        id: img.blog.id,
        title: img.blog.title,
        field: 'gallery',
      });
    }

    const projectCovers = await prisma.project.findMany({
      where: { OR: [{ coverImage: mediaUrl }, { coverImage: mediaSecureUrl }] },
      select: { id: true, title: true },
    });

    for (const p of projectCovers) {
      if (!usages.some((u) => u.type === 'project' && u.id === p.id)) {
        usages.push({ type: 'project', id: p.id, title: p.title, field: 'coverImage' });
      }
    }

    const blogCovers = await prisma.blog.findMany({
      where: { OR: [{ coverImage: mediaUrl }, { coverImage: mediaSecureUrl }] },
      select: { id: true, title: true },
    });

    for (const b of blogCovers) {
      if (!usages.some((u) => u.type === 'blog' && u.id === b.id)) {
        usages.push({ type: 'blog', id: b.id, title: b.title, field: 'coverImage' });
      }
    }

    return usages;
  }

  static async findByPublicId(publicId) {
    return prisma.media.findFirst({
      where: { publicId, deletedAt: null },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
      },
    });
  }
}
