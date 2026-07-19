import prisma from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export class BlogCategoryService {
  static async findAll({ includeDeleted = false } = {}) {
    const where = includeDeleted ? {} : { deletedAt: null };

    return prisma.blogCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            blogs: {
              where: includeDeleted ? {} : { deletedAt: null },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async findById(id, { includeDeleted = false } = {}) {
    const where = { id, ...(includeDeleted ? {} : { deletedAt: null }) };

    const category = await prisma.blogCategory.findFirst({
      where,
      include: {
        _count: {
          select: {
            blogs: {
              where: includeDeleted ? {} : { deletedAt: null },
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  static async findBySlug(slug) {
    const category = await prisma.blogCategory.findFirst({
      where: { slug, deletedAt: null },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  static async generateUniqueSlug(name, excludeId = null) {
    let slug = slugify(name);
    const where = { slug, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };

    const existing = await prisma.blogCategory.findFirst({ where });
    if (!existing) return slug;

    let counter = 2;
    while (true) {
      const candidate = `${slug}-${counter}`;
      const exists = await prisma.blogCategory.findFirst({
        where: { slug: candidate, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
      });
      if (!exists) return candidate;
      counter++;
    }
  }

  static async create({ name, description }) {
    const existing = await prisma.blogCategory.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new Error('Category name already exists');
    }

    const slug = await this.generateUniqueSlug(name);

    return prisma.blogCategory.create({
      data: {
        name: name.trim(),
        slug,
        description: description || null,
      },
    });
  }

  static async update(id, { name, description }) {
    const category = await prisma.blogCategory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await prisma.blogCategory.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('Category name already exists');
      }
    }

    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      const newSlug = slugify(name.trim());
      if (newSlug !== category.slug) {
        updateData.slug = await this.generateUniqueSlug(name.trim(), id);
      }
    }
    if (description !== undefined) {
      updateData.description = description || null;
    }

    return prisma.blogCategory.update({
      where: { id },
      data: updateData,
    });
  }

  static async delete(id) {
    const category = await prisma.blogCategory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const blogCount = await prisma.blog.count({
      where: {
        categories: { some: { id } },
        deletedAt: null,
      },
    });

    if (blogCount > 0) {
      throw new Error(
        `This category is assigned to ${blogCount} blog${blogCount !== 1 ? 's' : ''} and cannot be deleted. Remove the category from all blogs first.`
      );
    }

    await prisma.blogCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Category deleted successfully' };
  }

  static async restore(id) {
    const category = await prisma.blogCategory.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!category) {
      throw new Error('Deleted category not found');
    }

    const existing = await prisma.blogCategory.findFirst({
      where: {
        name: { equals: category.name, mode: 'insensitive' },
        deletedAt: null,
        id: { not: id },
      },
    });

    if (existing) {
      throw new Error('A category with this name already exists');
    }

    return prisma.blogCategory.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  static async search(query) {
    return prisma.blogCategory.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: { blogs: { where: { deletedAt: null } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
