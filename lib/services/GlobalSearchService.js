import prisma from '@/lib/prisma';

const SEARCH_LIMIT = 5;

function result(id, title, subtitle, href, icon, meta = {}) {
  return { id, title, subtitle, href, icon, meta };
}

export class GlobalSearchService {
  static async searchProjects(query, user) {
    if (!user.permissions?.includes('projects.read') && user.roleName !== 'ADMIN') {
      return [];
    }

    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { shortDescription: { contains: query, mode: 'insensitive' } },
          { client: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        featured: true,
        client: true,
        coverImage: true,
        createdAt: true,
        author: { select: { name: true } },
        categories: { select: { name: true }, take: 2 },
      },
    });

    return projects.map((p) =>
      result(
        p.id,
        p.title,
        [p.status, p.client, p.author?.name].filter(Boolean).join(' · '),
        `/dashboard/projects/${p.id}`,
        'FolderKanban',
        { status: p.status, featured: p.featured, type: 'project', categories: p.categories?.map(c => c.name) }
      )
    );
  }

  static async searchBlogs(query, user) {
    if (!user.permissions?.includes('blogs.read') && user.roleName !== 'ADMIN') {
      return [];
    }

    const blogs = await prisma.blog.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        featured: true,
        excerpt: true,
        createdAt: true,
        author: { select: { name: true } },
        categories: { select: { name: true }, take: 2 },
      },
    });

    return blogs.map((b) =>
      result(
        b.id,
        b.title,
        [b.status, b.author?.name].filter(Boolean).join(' · '),
        `/dashboard/blogs/${b.id}`,
        'FileText',
        { status: b.status, featured: b.featured, type: 'blog', categories: b.categories?.map(c => c.name) }
      )
    );
  }

  static async searchMedia(query, user) {
    if (!user.permissions?.includes('media.read') && user.roleName !== 'ADMIN') {
      return [];
    }

    const media = await prisma.media.findMany({
      where: {
        deletedAt: null,
        OR: [
          { originalName: { contains: query, mode: 'insensitive' } },
          { fileName: { contains: query, mode: 'insensitive' } },
          { altText: { contains: query, mode: 'insensitive' } },
          { folder: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: SEARCH_LIMIT,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        fileName: true,
        mimeType: true,
        format: true,
        folder: true,
        fileSize: true,
        url: true,
        secureUrl: true,
        createdAt: true,
      },
    });

    return media.map((m) =>
      result(
        m.id,
        m.originalName || m.fileName,
        [m.format?.toUpperCase(), m.folder || 'Root'].filter(Boolean).join(' · '),
        `/dashboard/media`,
        'Image',
        { mimeType: m.mimeType, format: m.format, type: 'media', url: m.secureUrl || m.url }
      )
    );
  }

  static async searchUsers(query, user) {
    if (!user.permissions?.includes('users.read') && user.roleName !== 'ADMIN') {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: SEARCH_LIMIT,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        avatar: true,
        createdAt: true,
        role: { select: { name: true } },
      },
    });

    return users.map((u) =>
      result(
        u.id,
        u.name,
        [u.email, u.role?.name].filter(Boolean).join(' · '),
        `/dashboard/users`,
        'Users',
        { status: u.status, type: 'user', role: u.role?.name, avatar: u.avatar }
      )
    );
  }

  static async searchRoles(query, user) {
    if (!user.permissions?.includes('roles.read') && user.roleName !== 'ADMIN') {
      return [];
    }

    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: SEARCH_LIMIT,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { users: { where: { deletedAt: null } } } },
      },
    });

    return roles.map((r) =>
      result(
        r.id,
        r.name,
        r.description || `${r._count.users} member${r._count.users !== 1 ? 's' : ''}`,
        `/dashboard/roles`,
        'Shield',
        { type: 'role', memberCount: r._count.users }
      )
    );
  }

  static async searchCategories(query, user) {
    if (!user.permissions?.includes('projects.read') && !user.permissions?.includes('blogs.read') && user.roleName !== 'ADMIN') {
      return [];
    }

    const [projectCategories, blogCategories] = await Promise.all([
      user.permissions?.includes('projects.read') || user.roleName === 'ADMIN'
        ? prisma.projectCategory.findMany({
            where: {
              deletedAt: null,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: SEARCH_LIMIT,
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              _count: { select: { projects: { where: { deletedAt: null } } } },
            },
          })
        : [],
      user.permissions?.includes('blogs.read') || user.roleName === 'ADMIN'
        ? prisma.blogCategory.findMany({
            where: {
              deletedAt: null,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: SEARCH_LIMIT,
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              _count: { select: { blogs: { where: { deletedAt: null } } } },
            },
          })
        : [],
    ]);

    const results = [
      ...projectCategories.map((c) =>
        result(
          c.id,
          c.name,
          `${c._count.projects} project${c._count.projects !== 1 ? 's' : ''}`,
          `/dashboard/projects?category=${c.id}`,
          'Tag',
          { type: 'project-category', count: c._count.projects }
        )
      ),
      ...blogCategories.map((c) =>
        result(
          c.id,
          c.name,
          `${c._count.blogs} blog${c._count.blogs !== 1 ? 's' : ''}`,
          `/dashboard/blogs?category=${c.id}`,
          'Tag',
          { type: 'blog-category', count: c._count.blogs }
        )
      ),
    ];

    return results.slice(0, SEARCH_LIMIT);
  }

  static async searchActivity(query, user) {
    if (!user.permissions?.includes('projects.read') && !user.permissions?.includes('blogs.read') && user.roleName !== 'ADMIN') {
      return [];
    }

    const activities = await prisma.activityLog.findMany({
      where: {
        OR: [
          { entityType: { contains: query, mode: 'insensitive' } },
          { entityName: { contains: query, mode: 'insensitive' } },
          { action: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: SEARCH_LIMIT,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityName: true,
        entityId: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    return activities.map((a) =>
      result(
        a.id,
        `${a.action} ${a.entityType}`,
        [a.entityName, a.user?.name].filter(Boolean).join(' · '),
        `/dashboard`,
        'Activity',
        { type: 'activity', action: a.action, entityType: a.entityType, entityId: a.entityId }
      )
    );
  }

  static async search(query, user) {
    const roleName = user.roleName || user.role?.name || 'ADMIN';

    const [
      projects,
      blogs,
      media,
      users,
      roles,
      categories,
      activity,
    ] = await Promise.all([
      this.searchProjects(query, { ...user, roleName }),
      this.searchBlogs(query, { ...user, roleName }),
      this.searchMedia(query, { ...user, roleName }),
      this.searchUsers(query, { ...user, roleName }),
      this.searchRoles(query, { ...user, roleName }),
      this.searchCategories(query, { ...user, roleName }),
      this.searchActivity(query, { ...user, roleName }),
    ]);

    const totalResults = projects.length + blogs.length + media.length + users.length + roles.length + categories.length + activity.length;

    return {
      groups: {
        projects,
        blogs,
        media,
        users,
        roles,
        categories,
        activity,
      },
      totalResults,
      query,
    };
  }
}
