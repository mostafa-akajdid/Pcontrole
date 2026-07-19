import prisma from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/password';
import { EventService } from './EventService';

export class UserService {
  static async findAll({ page = 1, perPage = 10, search = '', status = '', roleId = '', sort = 'createdAt', order = 'desc' }) {
    const safePerPage = Math.min(100, Math.max(1, parseInt(perPage) || 10));
    const safePage = Math.max(1, parseInt(page) || 1);
    const allowedSortFields = ['name', 'email', 'createdAt', 'status', 'lastLoginAt', 'updatedAt'];
    const safeSort = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const safeOrder = order === 'asc' ? 'asc' : 'desc';

    const where = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    const orderBy = { [safeSort]: safeOrder };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true },
        skip: (safePage - 1) * safePerPage,
        take: safePerPage,
        orderBy,
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return { users: usersWithoutPasswords, total };
  }

  static async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    const permissions = user.role?.permissions?.map((p) => p.name) || [];
    return { ...userWithoutPassword, permissions };
  }

  static async create({ name, email, password, roleId, phone, bio, avatar }, metadata = {}) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new Error('Role not found');
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId,
        phone,
        bio,
        avatar,
      },
      include: { role: true },
    });

    const { password: _, ...userWithoutPassword } = user;

    EventService.emit('user.created', {
      actorId: metadata.actorId,
      entityId: user.id,
      entityName: user.name,
      newValues: { name: user.name, email: user.email, roleId: user.roleId },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return userWithoutPassword;
  }

  static async update(id, data, metadata = {}) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    if (data.roleId) {
      const role = await prisma.role.findUnique({ where: { id: data.roleId } });
      if (!role) {
        throw new Error('Role not found');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    EventService.emit('user.updated', {
      actorId: metadata.actorId || id,
      entityId: id,
      entityName: updatedUser.name,
      oldValues: { name: user.name, email: user.email, roleId: user.roleId },
      newValues: data,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return userWithoutPassword;
  }

  static async delete(id, metadata = {}) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    EventService.emit('user.deleted', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: user.name,
      oldValues: { name: user.name, email: user.email },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return { message: 'User deleted successfully' };
  }

  static async restore(id, metadata = {}) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });

    EventService.emit('user.restored', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: user.name,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return { message: 'User restored successfully' };
  }

  static async updateStatus(id, status, metadata = {}) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id },
      data: { status },
    });

    EventService.emit('user.status_changed', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: user.name,
      oldValues: { status: user.status },
      newValues: { status },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return { message: `User ${status.toLowerCase()} successfully` };
  }

  static async adminResetPassword(id, { newPassword }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }

  static async forcePasswordChange(id, enabled) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id },
      data: { forcePasswordChange: enabled },
    });

    return { message: `Password change ${enabled ? 'required' : 'not required'}` };
  }

  static async changePassword(id, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword, forcePasswordChange: false },
    });

    return { message: 'Password changed successfully' };
  }

  static async getStats() {
    const [total, active, inactive, suspended, deleted] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.user.count({ where: { deletedAt: null, status: 'INACTIVE' } }),
      prisma.user.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      prisma.user.count({ where: { deletedAt: { not: null } } }),
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

    const recentLogins = await prisma.user.findMany({
      where: { deletedAt: null, lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, avatar: true, lastLoginAt: true, status: true },
    });

    return { total, active, inactive, suspended, deleted, roleDistribution, recentLogins };
  }

  static async getRecentUsers(limit = 5) {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { role: true },
    });

    return users.map(({ password, ...user }) => user);
  }

  static async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }
}
