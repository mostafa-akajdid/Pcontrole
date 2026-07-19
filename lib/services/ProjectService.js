import prisma from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { EventService } from './EventService';

export class ProjectService {
  static async findAll({
    page = 1,
    perPage = 12,
    search = '',
    status = '',
    featured = null,
    categoryId = '',
    year = null,
    sort = 'createdAt',
    order = 'desc',
  } = {}) {
    const where = { deletedAt: null };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { client: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && ['DRAFT', 'PUBLISHED'].includes(status)) {
      where.status = status;
    }

    if (featured !== null) {
      where.featured = featured;
    }

    if (categoryId) {
      where.categories = { some: { id: categoryId, deletedAt: null } };
    }

    if (year) {
      where.year = parseInt(year, 10);
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'year', 'publishedAt'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * perPage;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          categories: true,
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { images: true } },
        },
        skip,
        take: perPage,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total };
  }

  static async findById(id) {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        categories: true,
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { images: true } },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  static async findByIdOrThrow(id) {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, title: true, slug: true, authorId: true, status: true, featured: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  static async findBySlug(slug) {
    const project = await prisma.project.findFirst({
      where: { slug, deletedAt: null },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        categories: true,
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { images: true } },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  static async generateUniqueSlug(title, excludeId = null) {
    let slug = slugify(title);
    const where = { slug, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };

    const existing = await prisma.project.findFirst({ where });
    if (!existing) return slug;

    let counter = 2;
    while (true) {
      const candidate = `${slug}-${counter}`;
      const exists = await prisma.project.findFirst({
        where: { slug: candidate, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
      });
      if (!exists) return candidate;
      counter++;
    }
  }

  static async create({
    title,
    shortDescription,
    fullDescription,
    coverImage,
    featured = false,
    status = 'DRAFT',
    client,
    location,
    year,
    metaTitle,
    metaDescription,
    authorId,
    categoryIds = [],
    images = [],
  }, metadata = {}) {
    if (categoryIds.length > 0) {
      const categories = await prisma.projectCategory.findMany({
        where: { id: { in: categoryIds }, deletedAt: null },
      });
      if (categories.length !== categoryIds.length) {
        throw new Error('One or more categories not found');
      }
    }

    const slug = await this.generateUniqueSlug(title);

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        slug,
        shortDescription: shortDescription || null,
        fullDescription: fullDescription || null,
        coverImage: coverImage || null,
        featured: featured || false,
        status: status || 'DRAFT',
        client: client || null,
        location: location || null,
        year: year ? parseInt(year, 10) : null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        authorId,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        categories: categoryIds.length > 0
          ? { connect: categoryIds.map((id) => ({ id })) }
          : undefined,
        images: images.length > 0
          ? {
              create: images.map((img, index) => ({
                url: img.url,
                publicId: img.publicId || null,
                altText: img.altText || null,
                caption: img.caption || null,
                sortOrder: img.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        categories: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    EventService.emit('project.created', {
      actorId: metadata.actorId || authorId,
      authorId,
      entityId: project.id,
      entityName: project.title,
      newValues: { title: project.title, status: project.status },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return project;
  }

  static async update(id, data, metadata = {}) {
    const project = await this.findByIdOrThrow(id);

    const updateData = {};

    if (data.title !== undefined) {
      updateData.title = data.title.trim();
      const newSlug = slugify(data.title.trim());
      if (newSlug !== project.slug) {
        updateData.slug = await this.generateUniqueSlug(data.title.trim(), id);
      }
    }

    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription || null;
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription || null;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null;
    if (data.client !== undefined) updateData.client = data.client || null;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle || null;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription || null;

    if (data.featured !== undefined) {
      updateData.featured = Boolean(data.featured);
    }

    if (data.year !== undefined) {
      updateData.year = data.year ? parseInt(data.year, 10) : null;
    }

    if (data.status !== undefined && data.status !== project.status) {
      updateData.status = data.status;
      if (data.status === 'PUBLISHED' && !project.publishedAt) {
        updateData.publishedAt = new Date();
      }
      if (data.status === 'DRAFT') {
        updateData.publishedAt = null;
      }
    }

    if (data.categoryIds !== undefined) {
      updateData.categories = {
        set: data.categoryIds.map((catId) => ({ id: catId })),
      };
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        categories: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const changedFields = Object.keys(updateData).filter((k) => k !== 'categories');
    EventService.emit('project.updated', {
      actorId: metadata.actorId || project.authorId,
      entityId: id,
      entityName: updatedProject.title,
      changedFields,
      oldValues: project,
      newValues: updateData,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    if (data.status && data.status !== project.status && data.status === 'PUBLISHED') {
      EventService.emit('project.published', {
        actorId: metadata.actorId || project.authorId,
        entityId: id,
        entityName: updatedProject.title,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      }).catch(() => {});
    }

    return updatedProject;
  }

  static async delete(id, metadata = {}) {
    const project = await this.findByIdOrThrow(id);

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    EventService.emit('project.deleted', {
      actorId: metadata.actorId || project.authorId,
      entityId: id,
      entityName: project.title,
      oldValues: { title: project.title, status: project.status },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return { message: 'Project deleted successfully', title: project.title };
  }

  static async restore(id, metadata = {}) {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!project) {
      throw new Error('Deleted project not found');
    }

    const restored = await prisma.project.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        categories: true,
      },
    });

    EventService.emit('project.restored', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: restored.title,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return restored;
  }

  static async findDeleted({
    page = 1,
    perPage = 12,
    search = '',
    sort = 'deletedAt',
    order = 'desc',
  } = {}) {
    const where = { deletedAt: { not: null } };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { client: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * perPage;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          categories: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: perPage,
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total };
  }

  static async permanentDelete(id, metadata = {}) {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!project) {
      throw new Error('Deleted project not found');
    }

    await prisma.projectImage.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });

    EventService.emit('project.permanently_deleted', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: project.title,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return { message: 'Project permanently deleted', title: project.title };
  }

  static async publish(id) {
    return this.update(id, { status: 'PUBLISHED' });
  }

  static async unpublish(id) {
    return this.update(id, { status: 'DRAFT' });
  }

  static async setFeatured(id, featured) {
    return this.update(id, { featured });
  }

  static async bulkAction({ ids, action }, metadata = {}) {
    if (!ids || ids.length === 0) {
      throw new Error('No projects selected');
    }

    const where = { id: { in: ids }, deletedAt: null };

    switch (action) {
      case 'publish': {
        const result = await prisma.project.updateMany({
          where: { ...where, status: 'DRAFT' },
          data: { status: 'PUBLISHED', publishedAt: new Date() },
        });
        EventService.emit('project.bulk_action', {
          actorId: metadata.actorId,
          action: 'publish',
          count: result.count,
          entityIds: ids,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }).catch(() => {});
        return { message: `${result.count} project(s) published`, count: result.count };
      }

      case 'unpublish': {
        const result = await prisma.project.updateMany({
          where: { ...where, status: 'PUBLISHED' },
          data: { status: 'DRAFT', publishedAt: null },
        });
        return { message: `${result.count} project(s) unpublished`, count: result.count };
      }

      case 'delete': {
        const result = await prisma.project.updateMany({
          where,
          data: { deletedAt: new Date() },
        });
        EventService.emit('project.bulk_action', {
          actorId: metadata.actorId,
          action: 'delete',
          count: result.count,
          entityIds: ids,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }).catch(() => {});
        return { message: `${result.count} project(s) deleted`, count: result.count };
      }

      case 'restore': {
        const deletedWhere = { id: { in: ids }, deletedAt: { not: null } };
        const result = await prisma.project.updateMany({
          where: deletedWhere,
          data: { deletedAt: null },
        });
        return { message: `${result.count} project(s) restored`, count: result.count };
      }

      case 'permanentDelete': {
        const deletedBulkWhere = { id: { in: ids }, deletedAt: { not: null } };
        const toDelete = await prisma.project.findMany({
          where: deletedBulkWhere,
          select: { id: true },
        });
        if (toDelete.length > 0) {
          const deleteIds = toDelete.map((p) => p.id);
          await prisma.projectImage.deleteMany({ where: { projectId: { in: deleteIds } } });
          const result = await prisma.project.deleteMany({ where: { id: { in: deleteIds } } });
          EventService.emit('project.bulk_action', {
            actorId: metadata.actorId,
            action: 'permanentDelete',
            count: result.count,
            entityIds: deleteIds,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          }).catch(() => {});
          return { message: `${result.count} project(s) permanently deleted`, count: result.count };
        }
        return { message: '0 project(s) permanently deleted', count: 0 };
      }

      case 'feature': {
        const result = await prisma.project.updateMany({
          where,
          data: { featured: true },
        });
        return { message: `${result.count} project(s) featured`, count: result.count };
      }

      case 'unfeature': {
        const result = await prisma.project.updateMany({
          where,
          data: { featured: false },
        });
        return { message: `${result.count} project(s) unfeatured`, count: result.count };
      }

      default:
        throw new Error('Invalid action');
    }
  }

  static async getStats() {
    const [total, published, draft, featured, trashed] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      prisma.project.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      prisma.project.count({ where: { deletedAt: null, featured: true } }),
      prisma.project.count({ where: { deletedAt: { not: null } } }),
    ]);

    return { total, published, draft, featured, trashed };
  }

  static async addImage(projectId, { url, publicId, altText, caption, sortOrder }) {
    await this.findByIdOrThrow(projectId);

    return prisma.projectImage.create({
      data: {
        projectId,
        url,
        publicId: publicId || null,
        altText: altText || null,
        caption: caption || null,
        sortOrder: sortOrder ?? 0,
      },
    });
  }

  static async removeImage(imageId, projectId) {
    const where = { id: imageId };
    if (projectId) where.projectId = projectId;

    const image = await prisma.projectImage.findFirst({ where });

    if (!image) {
      throw new Error('Image not found');
    }

    await prisma.projectImage.delete({ where: { id: imageId } });
    return { message: 'Image removed successfully' };
  }

  static async reorderImages(projectId, imageIds) {
    await this.findByIdOrThrow(projectId);

    const images = await prisma.projectImage.findMany({
      where: { projectId, id: { in: imageIds } },
    });

    if (images.length !== imageIds.length) {
      throw new Error('One or more images not found in this project');
    }

    const updates = imageIds.map((id, index) =>
      prisma.projectImage.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);
    return { message: 'Images reordered successfully' };
  }

  static async setCoverImage(projectId, imageId) {
    const image = await prisma.projectImage.findFirst({
      where: { id: imageId, projectId },
    });

    if (!image) {
      throw new Error('Image not found in this project');
    }

    return prisma.project.update({
      where: { id: projectId },
      data: { coverImage: image.url },
    });
  }
}
