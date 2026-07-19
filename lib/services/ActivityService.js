import prisma from '@/lib/prisma';

export class ActivityService {
  static async log({ userId, action, entityType, entityId, details = null, ipAddress = null }) {
    return prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: String(entityId),
        details,
        ipAddress,
      },
    });
  }

  static async getRecent(limit = 10) {
    return prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  static async getByEntity(entityType, entityId) {
    return prisma.activityLog.findMany({
      where: {
        entityType,
        entityId: String(entityId),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  static async getByUser(userId, limit = 10) {
    return prisma.activityLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
      prisma.activityLog.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.activityLog.count({
        where: { createdAt: { gte: thisWeek } },
      }),
      prisma.activityLog.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      prisma.activityLog.count(),
    ]);

    return { today: todayCount, thisWeek: weekCount, thisMonth: monthCount, total: totalCount };
  }

  static async getEntityCounts() {
    const [projects, blogs, media, users] = await Promise.all([
      prisma.activityLog.groupBy({
        by: ['entityType'],
        where: { entityType: 'Project' },
        _count: true,
      }),
      prisma.activityLog.groupBy({
        by: ['entityType'],
        where: { entityType: 'Blog' },
        _count: true,
      }),
      prisma.activityLog.groupBy({
        by: ['entityType'],
        where: { entityType: 'Media' },
        _count: true,
      }),
      prisma.activityLog.groupBy({
        by: ['entityType'],
        where: { entityType: 'User' },
        _count: true,
      }),
    ]);

    return {
      projects: projects[0]?._count || 0,
      blogs: blogs[0]?._count || 0,
      media: media[0]?._count || 0,
      users: users[0]?._count || 0,
    };
  }
}
