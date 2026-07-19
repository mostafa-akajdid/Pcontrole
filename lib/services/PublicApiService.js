import prisma from '@/lib/prisma';

const PROJECT_SELECT = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  fullDescription: true,
  client: true,
  location: true,
  year: true,
  status: true,
  metaTitle: true,
  metaDescription: true,
  publishedAt: true,
  createdAt: true,
  categories: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    select: {
      id: true,
      url: true,
      altText: true,
      caption: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' },
  },
};

function formatProject(project) {
  return {
    id: project.id,
    title: project.title,
    shortDescription: project.shortDescription || '',
    description: project.fullDescription || null,
    client: project.client || '',
    location: project.location || '',
    year: project.year || null,
    status: project.status,
    categories: (project.categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
    gallery: (project.images || []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.altText || '',
      caption: img.caption || '',
    })),
    meta: {
      title: project.metaTitle || '',
      description: project.metaDescription || '',
    },
    publishedAt: project.publishedAt?.toISOString() || null,
    createdAt: project.createdAt?.toISOString() || null,
  };
}

export class PublicApiService {
  static async findPublishedProjects({
    page = 1,
    limit = 12,
    search = '',
    category = '',
    year = null,
    sort = 'publishedAt',
    order = 'desc',
  } = {}) {
    const where = {
      deletedAt: null,
      status: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { client: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categories = { some: { slug: category, deletedAt: null } };
    }

    if (year) {
      where.year = parseInt(year, 10);
    }

    const allowedSortFields = ['publishedAt', 'createdAt', 'title', 'year'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'publishedAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: PROJECT_SELECT,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects: projects.map(formatProject),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async findPublishedProjectBySlug(slug) {
    const project = await prisma.project.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: 'PUBLISHED',
      },
      select: PROJECT_SELECT,
    });

    if (!project) return null;

    return formatProject(project);
  }

  static generateETag(data) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `"${hash}"`;
  }

  static setCacheHeaders(res, data, maxAge = 300) {
    const etag = this.generateETag(data);
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
    res.setHeader('ETag', etag);
    return etag;
  }
}
