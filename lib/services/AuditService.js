import prisma from '@/lib/prisma';

export class AuditService {
  static async log({ userId, action, module, entityType, entityId = null, oldValues = null, newValues = null, ipAddress = null, userAgent = null, requestId = null }) {
    return prisma.auditLog.create({
      data: { userId, action, module, entityType, entityId: entityId ? String(entityId) : null, oldValues, newValues, ipAddress, userAgent, requestId },
    });
  }

  static async findAll({ page = 1, perPage = 20, module = null, action = null, entityType = null, userId = null, search = '', startDate = null, endDate = null }) {
    const where = {};

    if (module) where.module = module;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { entityType: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: perPage,
        skip: (page - 1) * perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, perPage };
  }

  static async findById(id) {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  static async getRecent(limit = 10) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  static async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [today, thisWeek, thisMonth, total] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.auditLog.count(),
    ]);

    return { today, thisWeek, thisMonth, total };
  }

  static async getModuleCounts() {
    const counts = await prisma.auditLog.groupBy({
      by: ['module'],
      _count: true,
      orderBy: { _count: { module: 'desc' } },
    });
    return counts.map((c) => ({ module: c.module, count: c._count }));
  }

  static async getByEntity(entityType, entityId) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId: String(entityId) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }
}
