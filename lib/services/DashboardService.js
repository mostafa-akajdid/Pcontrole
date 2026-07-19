import prisma from '@/lib/prisma';

export class DashboardService {
  static async getStats() {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      publishedProjects,
      draftProjects,
      featuredProjects,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      featuredBlogs,
      totalMedia,
      totalCategories,
      totalActivity,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      prisma.project.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      prisma.project.count({ where: { deletedAt: null, featured: true } }),
      prisma.blog.count({ where: { deletedAt: null } }),
      prisma.blog.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      prisma.blog.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      prisma.blog.count({ where: { deletedAt: null, featured: true } }),
      prisma.media.count({ where: { deletedAt: null } }),
      Promise.all([
        prisma.projectCategory.count({ where: { deletedAt: null } }),
        prisma.blogCategory.count({ where: { deletedAt: null } }),
      ]).then(([pc, bc]) => pc + bc),
      prisma.activityLog.count(),
    ]);

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: { where: { deletedAt: null } } },
        },
      },
    });

    const roleDistribution = roles.map((r) => ({
      roleId: r.id,
      roleName: r.name,
      count: r._count.users,
    }));

    return {
      projects: {
        total: totalProjects,
        published: publishedProjects,
        draft: draftProjects,
        featured: featuredProjects,
      },
      blogs: {
        total: totalBlogs,
        published: publishedBlogs,
        draft: draftBlogs,
        featured: featuredBlogs,
      },
      media: { total: totalMedia },
      users: { total: totalUsers, active: activeUsers, roleDistribution },
      categories: { total: totalCategories },
      activity: { total: totalActivity },
    };
  }

  static async getRecentProjects(limit = 5) {
    return prisma.project.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        featured: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, avatar: true } },
        categories: { select: { id: true, name: true } },
      },
    });
  }

  static async getRecentBlogs(limit = 5) {
    return prisma.blog.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        featured: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, avatar: true } },
        categories: { select: { id: true, name: true } },
      },
    });
  }

  static async getRecentActivity(limit = 10) {
    return prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  static async getRecentUsers(limit = 5) {
    return prisma.user.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  static async getRecentMedia(limit = 5) {
    return prisma.media.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        url: true,
        secureUrl: true,
        mimeType: true,
        format: true,
        fileSize: true,
        folder: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true } },
      },
    });
  }

  static async getContentSummary() {
    const [
      publishedProjects,
      draftProjects,
      featuredProjects,
      publishedBlogs,
      draftBlogs,
      featuredBlogs,
      recentlyUpdatedProjects,
      recentlyUpdatedBlogs,
    ] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      prisma.project.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      prisma.project.count({ where: { deletedAt: null, featured: true } }),
      prisma.blog.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      prisma.blog.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      prisma.blog.count({ where: { deletedAt: null, featured: true } }),
      prisma.project.findMany({
        where: { deletedAt: null },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
      prisma.blog.findMany({
        where: { deletedAt: null },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
    ]);

    const total = publishedProjects + draftProjects;
    const publishRate = total > 0 ? Math.round((publishedProjects / total) * 100) : 0;

    return {
      projects: { published: publishedProjects, draft: draftProjects, featured: featuredProjects, publishRate },
      blogs: { published: publishedBlogs, draft: draftBlogs, featured: featuredBlogs },
      recentlyUpdated: { projects: recentlyUpdatedProjects, blogs: recentlyUpdatedBlogs },
    };
  }

  static async getActivityTrend(days = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const activities = await prisma.activityLog.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, action: true, entityType: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyCounts = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dailyCounts[key] = { date: key, count: 0, actions: {} };
    }

    activities.forEach((a) => {
      const key = a.createdAt.toISOString().split('T')[0];
      if (dailyCounts[key]) {
        dailyCounts[key].count++;
        dailyCounts[key].actions[a.action] = (dailyCounts[key].actions[a.action] || 0) + 1;
      }
    });

    return Object.values(dailyCounts);
  }

  static async getCategoryBreakdown() {
    const [projectCategories, blogCategories] = await Promise.all([
      prisma.projectCategory.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          _count: { select: { projects: { where: { deletedAt: null } } } },
        },
        orderBy: { projects: { _count: 'desc' } },
        take: 10,
      }),
      prisma.blogCategory.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          _count: { select: { blogs: { where: { deletedAt: null } } } },
        },
        orderBy: { blogs: { _count: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      projects: projectCategories.map((c) => ({
        name: c.name,
        count: c._count.projects,
      })),
      blogs: blogCategories.map((c) => ({
        name: c.name,
        count: c._count.blogs,
      })),
    };
  }

  static async getStorageBreakdown() {
    const [totalMedia, byFormat, totalSize] = await Promise.all([
      prisma.media.count({ where: { deletedAt: null } }),
      prisma.media.groupBy({
        by: ['format'],
        where: { deletedAt: null },
        _count: true,
        _sum: { fileSize: true },
        orderBy: { _count: { format: 'desc' } },
      }),
      prisma.media.aggregate({
        where: { deletedAt: null },
        _sum: { fileSize: true },
      }),
    ]);

    return {
      totalFiles: totalMedia,
      totalSizeBytes: totalSize._sum.fileSize || 0,
      byFormat: byFormat.map((f) => ({
        format: f.format,
        count: f._count,
        sizeBytes: f._sum.fileSize || 0,
      })),
    };
  }

  static async getSystemHealth() {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    let cloudinaryStatus = 'not_configured';
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinaryStatus = 'configured';
    }

    let smtpStatus = 'not_configured';
    const smtpHost = await prisma.setting.findUnique({ where: { key: 'smtpHost' } });
    if (smtpHost?.value) {
      smtpStatus = 'configured';
    }

    let maintenanceMode = 'false';
    const maintenanceSetting = await prisma.setting.findUnique({ where: { key: 'maintenanceMode' } });
    if (maintenanceSetting) {
      maintenanceMode = maintenanceSetting.value;
    }

    return {
      database: dbStatus,
      cloudinary: cloudinaryStatus,
      smtp: smtpStatus,
      environment: process.env.NODE_ENV || 'development',
      maintenanceMode: maintenanceMode === 'true',
    };
  }

  static async getUserGrowth(days = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyCounts = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dailyCounts[key] = { date: key, count: 0 };
    }

    users.forEach((u) => {
      const key = u.createdAt.toISOString().split('T')[0];
      if (dailyCounts[key]) {
        dailyCounts[key].count++;
      }
    });

    return Object.values(dailyCounts);
  }

  static async getOverview() {
    const [stats, recentProjects, recentBlogs, recentActivity, recentUsers, recentMedia, contentSummary, activityTrend, categoryBreakdown, storageBreakdown, systemHealth, userGrowth, recentNotifications, recentAuditLogs] = await Promise.all([
      this.getStats(),
      this.getRecentProjects(5),
      this.getRecentBlogs(5),
      this.getRecentActivity(15),
      this.getRecentUsers(5),
      this.getRecentMedia(5),
      this.getContentSummary(),
      this.getActivityTrend(30),
      this.getCategoryBreakdown(),
      this.getStorageBreakdown(),
      this.getSystemHealth(),
      this.getUserGrowth(30),
      prisma.notification.findMany({ where: { deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true, avatar: true } } } }),
    ]);

    return {
      stats,
      recentProjects,
      recentBlogs,
      recentActivity,
      recentUsers,
      recentMedia,
      contentSummary,
      activityTrend,
      categoryBreakdown,
      storageBreakdown,
      systemHealth,
      userGrowth,
      recentNotifications,
      recentAuditLogs,
    };
  }
}
