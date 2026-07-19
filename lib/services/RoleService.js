import prisma from '@/lib/prisma';
import { EventService } from './EventService';

export class RoleService {
  static async findAll() {
    return prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: { where: { deletedAt: null } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async findById(id) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        _count: {
          select: { users: { where: { deletedAt: null } } },
        },
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  static async create({ name, description, permissionIds = [] }, metadata = {}) {
    const existingRole = await prisma.role.findUnique({ where: { name: name.toUpperCase() } });
    if (existingRole) {
      throw new Error('Role name already exists');
    }

    const role = await prisma.role.create({
      data: {
        name: name.toUpperCase(),
        description,
        permissions: permissionIds.length > 0
          ? { connect: permissionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { permissions: true },
    });

    EventService.emit('role.created', {
      actorId: metadata.actorId,
      entityId: role.id,
      entityName: role.name,
      newValues: { name: role.name, description: role.description },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return role;
  }

  static async update(id, { name, description, permissionIds }, metadata = {}) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot modify system roles');
    }

    if (name && name.toUpperCase() !== role.name) {
      const existingRole = await prisma.role.findUnique({ where: { name: name.toUpperCase() } });
      if (existingRole) {
        throw new Error('Role name already exists');
      }
    }

    const updateData = {
      name: name ? name.toUpperCase() : undefined,
      description,
    };

    if (permissionIds !== undefined) {
      updateData.permissions = {
        set: permissionIds.map((id) => ({ id })),
      };
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: updateData,
      include: { permissions: true },
    });

    EventService.emit('role.updated', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: updatedRole.name,
      oldValues: { name: role.name, description: role.description },
      newValues: updateData,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return updatedRole;
  }

  static async delete(id, metadata = {}) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: { where: { deletedAt: null } } } } },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    if (role._count.users > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    await prisma.role.delete({ where: { id } });

    EventService.emit('role.deleted', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: role.name,
      oldValues: { name: role.name, description: role.description },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return { message: 'Role deleted successfully' };
  }

  static async clone(id, { name }, metadata = {}) {
    const sourceRole = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!sourceRole) {
      throw new Error('Role not found');
    }

    const newName = name || `${sourceRole.name} (Copy)`;
    const existingRole = await prisma.role.findUnique({ where: { name: newName.toUpperCase() } });
    if (existingRole) {
      throw new Error('Role name already exists');
    }

    const role = await prisma.role.create({
      data: {
        name: newName.toUpperCase(),
        description: sourceRole.description,
        isSystem: false,
        permissions: {
          connect: sourceRole.permissions.map((p) => ({ id: p.id })),
        },
      },
      include: { permissions: true },
    });

    EventService.emit('role.cloned', {
      actorId: metadata.actorId,
      entityId: role.id,
      entityName: role.name,
      newValues: { name: role.name, sourceRoleId: id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(() => {});

    return role;
  }

  static async getStats() {
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: { where: { deletedAt: null } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      userCount: r._count.users,
      permissionCount: r.permissions.length,
    }));
  }

  static async getAllPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  static async getPermissionsByModule() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    const grouped = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return grouped;
  }
}
