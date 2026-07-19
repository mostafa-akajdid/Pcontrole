import prisma from '@/lib/prisma';

export class NotificationService {
  static async create({ userId, type, title, message, entityType = null, entityId = null, priority = 'LOW', metadata = null }) {
    return prisma.notification.create({
      data: { userId, type, title, message, entityType, entityId, priority, metadata },
    });
  }

  static async findAll({ userId, page = 1, perPage = 20, type = null, priority = null, unreadOnly = false, search = '' }) {
    const where = { userId, deletedAt: null };

    if (unreadOnly) {
      where.readAt = null;
    }
    if (type) {
      where.type = type;
    }
    if (priority) {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: perPage,
        skip: (page - 1) * perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, total, page, perPage };
  }

  static async findById(id, userId) {
    return prisma.notification.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  static async markAsRead(id, userId) {
    return prisma.notification.updateMany({
      where: { id, userId, deletedAt: null, readAt: null },
      data: { readAt: new Date() },
    });
  }

  static async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, deletedAt: null, readAt: null },
      data: { readAt: new Date() },
    });
  }

  static async delete(id, userId) {
    return prisma.notification.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  static async bulkDelete(ids, userId) {
    return prisma.notification.updateMany({
      where: { id: { in: ids }, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  static async getUnreadCount(userId) {
    return prisma.notification.count({
      where: { userId, deletedAt: null, readAt: null },
    });
  }

  static async getStats(userId) {
    const [total, unread, today] = await Promise.all([
      prisma.notification.count({ where: { userId, deletedAt: null } }),
      prisma.notification.count({ where: { userId, deletedAt: null, readAt: null } }),
      prisma.notification.count({
        where: {
          userId,
          deletedAt: null,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);
    return { total, unread, today };
  }

  static async getRecent(userId, limit = 5) {
    return prisma.notification.findMany({
      where: { userId, deletedAt: null },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
