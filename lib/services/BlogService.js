import prisma from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { EventService } from './EventService';

export class BlogService {
  static async findAll({
    page = 1,
    perPage = 12,
    search = '',
    status = '',
    featured = null,
    categoryId = '',
    sort = 'createdAt',
    order = 'desc',
  } = {}) {
    const where = { deletedAt: null };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
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

    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'publishedAt'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * perPage;

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
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
      prisma.blog.count({ where }),
    ]);

    return { blogs, total };
  }

  static async findById(id) {
    const blog = await prisma.blog.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        categories: true,
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { images: true } },
      },
    });

    if (!blog) {
      throw new Error('Blog not found');
    }

    return blog;
  }

  static async findByIdOrThrow(id) {
    const blog = await prisma.blog.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, title: true, slug: true, authorId: true, status: true, featured: true },
    });

    if (!blog) {
      throw new Error('Blog not found');
    }

    return blog;
  }

  static async findBySlug(slug) {
    const blog = await prisma.blog.findFirst({
      where: { slug, deletedAt: null },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        categories: true,
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { images: true } },
      },
    });

    if (!blog) {
      throw new Error('Blog not found');
    }

    return blog;
  }

  static async generateUniqueSlug(title, excludeId = null) {
    let slug = slugify(title);
    const where = { slug, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };

    const existing = await prisma.blog.findFirst({ where });
    if (!existing) return slug;

    let counter = 2;
    while (true) {
      const candidate = `${slug}-${counter}`;
      const exists = await prisma.blog.findFirst({
        where: { slug: candidate, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
      });
      if (!exists) return candidate;
      counter++;
    }
  }

  static async create({
    title,
    slug: customSlug,
    excerpt,
    content,
    coverImage,
    featured = false,
    status = 'DRAFT',
    metaTitle,
    metaDescription,
    authorId,
    categoryIds = [],
    images = [],
  }, metadata = {}) {
    if (categoryIds.length > 0) {
      const categories = await prisma.blogCategory.findMany({
        where: { id: { in: categoryIds }, deletedAt: null },
      });
      if (categories.length !== categoryIds.length) {
        throw new Error('One or more categories not found');
      }
    }

    const slug = customSlug || await this.generateUniqueSlug(title);

    const blog = await prisma.blog.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: excerpt || null,
        content: content || null,
        coverImage: coverImage || null,
        featured: featured || false,
        status: status || 'DRAFT',
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

    EventService.emit('blog.created', {
      actorId: metadata.actorId || authorId,
      authorId,
      entityId: blog.id,
      entityName: blog.title,
      newValues: { title: blog.title, status: blog.status },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return blog;
  }

  static async update(id, data, metadata = {}) {
    const blog = await this.findByIdOrThrow(id);

    const updateData = {};

    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }

    if (data.slug !== undefined) {
      const trimmedSlug = data.slug.trim();
      if (trimmedSlug !== blog.slug) {
        const existing = await prisma.blog.findFirst({
          where: { slug: trimmedSlug, deletedAt: null, id: { not: id } },
        });
        if (existing) {
          throw new Error('A blog with this slug already exists');
        }
      }
      updateData.slug = trimmedSlug;
    } else if (data.title !== undefined) {
      const newSlug = slugify(data.title.trim());
      if (newSlug !== blog.slug) {
        updateData.slug = await this.generateUniqueSlug(data.title.trim(), id);
      }
    }

    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt || null;
    if (data.content !== undefined) updateData.content = data.content || null;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle || null;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription || null;

    if (data.featured !== undefined) {
      updateData.featured = Boolean(data.featured);
    }

    if (data.status !== undefined && data.status !== blog.status) {
      updateData.status = data.status;
      if (data.status === 'PUBLISHED' && !blog.publishedAt) {
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

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        categories: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const changedFields = Object.keys(updateData);
    EventService.emit('blog.updated', {
      actorId: metadata.actorId || blog.authorId,
      entityId: id,
      entityName: updatedBlog.title,
      changedFields,
      oldValues: blog,
      newValues: updateData,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    if (data.status && data.status !== blog.status && data.status === 'PUBLISHED') {
      EventService.emit('blog.published', {
        actorId: metadata.actorId || blog.authorId,
        entityId: id,
        entityName: updatedBlog.title,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      }).catch(() => {});
    }

    return updatedBlog;
  }

  static async delete(id, metadata = {}) {
    const blog = await this.findByIdOrThrow(id);

    await prisma.blog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    EventService.emit('blog.deleted', {
      actorId: metadata.actorId || blog.authorId,
      entityId: id,
      entityName: blog.title,
      oldValues: { title: blog.title, status: blog.status },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return { message: 'Blog deleted successfully', title: blog.title };
  }

  static async restore(id, metadata = {}) {
    const blog = await prisma.blog.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!blog) {
      throw new Error('Deleted blog not found');
    }

    const restored = await prisma.blog.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        categories: true,
      },
    });

    EventService.emit('blog.restored', {
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
        { excerpt: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * perPage;

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          categories: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: perPage,
      }),
      prisma.blog.count({ where }),
    ]);

    return { blogs, total };
  }

  static async permanentDelete(id, metadata = {}) {
    const blog = await prisma.blog.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!blog) {
      throw new Error('Deleted blog not found');
    }

    await prisma.blogImage.deleteMany({ where: { blogId: id } });
    await prisma.blog.delete({ where: { id } });

    EventService.emit('blog.permanently_deleted', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: blog.title,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return { message: 'Blog permanently deleted', title: blog.title };
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
      throw new Error('No blogs selected');
    }

    const where = { id: { in: ids }, deletedAt: null };

    switch (action) {
      case 'publish': {
        const result = await prisma.blog.updateMany({
          where: { ...where, status: 'DRAFT' },
          data: { status: 'PUBLISHED', publishedAt: new Date() },
        });
        EventService.emit('blog.bulk_action', {
          actorId: metadata.actorId,
          action: 'publish',
          count: result.count,
          entityIds: ids,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }).catch(() => {});
        return { message: `${result.count} blog(s) published`, count: result.count };
      }

      case 'unpublish': {
        const result = await prisma.blog.updateMany({
          where: { ...where, status: 'PUBLISHED' },
          data: { status: 'DRAFT', publishedAt: null },
        });
        return { message: `${result.count} blog(s) unpublished`, count: result.count };
      }

      case 'delete': {
        const result = await prisma.blog.updateMany({
          where,
          data: { deletedAt: new Date() },
        });
        EventService.emit('blog.bulk_action', {
          actorId: metadata.actorId,
          action: 'delete',
          count: result.count,
          entityIds: ids,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }).catch(() => {});
        return { message: `${result.count} blog(s) deleted`, count: result.count };
      }

      case 'restore': {
        const deletedWhere = { id: { in: ids }, deletedAt: { not: null } };
        const result = await prisma.blog.updateMany({
          where: deletedWhere,
          data: { deletedAt: null },
        });
        return { message: `${result.count} blog(s) restored`, count: result.count };
      }

      case 'permanentDelete': {
        const deletedBulkWhere = { id: { in: ids }, deletedAt: { not: null } };
        const toDelete = await prisma.blog.findMany({
          where: deletedBulkWhere,
          select: { id: true },
        });
        if (toDelete.length > 0) {
          const deleteIds = toDelete.map((b) => b.id);
          await prisma.blogImage.deleteMany({ where: { blogId: { in: deleteIds } } });
          const result = await prisma.blog.deleteMany({ where: { id: { in: deleteIds } } });
          EventService.emit('blog.bulk_action', {
            actorId: metadata.actorId,
            action: 'permanentDelete',
            count: result.count,
            entityIds: deleteIds,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          }).catch(() => {});
          return { message: `${result.count} blog(s) permanently deleted`, count: result.count };
        }
        return { message: '0 blog(s) permanently deleted', count: 0 };
      }

      case 'feature': {
        const result = await prisma.blog.updateMany({
          where,
          data: { featured: true },
        });
        return { message: `${result.count} blog(s) featured`, count: result.count };
      }

      case 'unfeature': {
        const result = await prisma.blog.updateMany({
          where,
          data: { featured: false },
        });
        return { message: `${result.count} blog(s) unfeatured`, count: result.count };
      }

      default:
        throw new Error('Invalid action');
    }
  }

  static async getStats() {
    const [total, published, draft, featured, trashed] = await Promise.all([
      prisma.blog.count({ where: { deletedAt: null } }),
      prisma.blog.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      prisma.blog.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      prisma.blog.count({ where: { deletedAt: null, featured: true } }),
      prisma.blog.count({ where: { deletedAt: { not: null } } }),
    ]);

    return { total, published, draft, featured, trashed };
  }

  static async addImage(blogId, { url, publicId, altText, caption, sortOrder }) {
    await this.findByIdOrThrow(blogId);

    return prisma.blogImage.create({
      data: {
        blogId,
        url,
        publicId: publicId || null,
        altText: altText || null,
        caption: caption || null,
        sortOrder: sortOrder ?? 0,
      },
    });
  }

  static async removeImage(imageId, blogId) {
    const where = { id: imageId };
    if (blogId) where.blogId = blogId;

    const image = await prisma.blogImage.findFirst({ where });

    if (!image) {
      throw new Error('Image not found');
    }

    await prisma.blogImage.delete({ where: { id: imageId } });
    return { message: 'Image removed successfully' };
  }

  static async reorderImages(blogId, imageIds) {
    await this.findByIdOrThrow(blogId);

    const images = await prisma.blogImage.findMany({
      where: { blogId, id: { in: imageIds } },
    });

    if (images.length !== imageIds.length) {
      throw new Error('One or more images not found in this blog');
    }

    const updates = imageIds.map((id, index) =>
      prisma.blogImage.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);
    return { message: 'Images reordered successfully' };
  }

  static async setCoverImage(blogId, imageId) {
    const image = await prisma.blogImage.findFirst({
      where: { id: imageId, blogId },
    });

    if (!image) {
      throw new Error('Image not found in this blog');
    }

    return prisma.blog.update({
      where: { id: blogId },
      data: { coverImage: image.url },
    });
  }
}
