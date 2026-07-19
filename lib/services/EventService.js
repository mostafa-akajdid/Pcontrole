const listeners = new Map();
let handlersRegistered = false;

export class EventService {
  static on(eventType, handler) {
    if (!listeners.has(eventType)) {
      listeners.set(eventType, []);
    }
    listeners.get(eventType).push(handler);
  }

  static off(eventType, handler) {
    if (!listeners.has(eventType)) return;
    const handlers = listeners.get(eventType).filter((h) => h !== handler);
    listeners.set(eventType, handlers);
  }

  static async emit(eventType, payload = {}) {
    const handlers = listeners.get(eventType) || [];
    const wildcardHandlers = listeners.get('*') || [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    const results = await Promise.allSettled(
      allHandlers.map(async (handler) => {
        try {
          await handler({ type: eventType, ...payload, timestamp: new Date() });
        } catch (err) {
          console.error(`EventService: Error in handler for "${eventType}":`, err);
        }
      })
    );

    return results;
  }

  static getRegisteredEvents() {
    return Array.from(listeners.keys());
  }

  static logError(err) {
    console.error('[EventService] Event processing error:', err?.message || err);
  }
}

if (!handlersRegistered) {
handlersRegistered = true;

EventService.on('project.created', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.authorId,
      type: 'content',
      title: 'Project Created',
      message: `Project "${event.entityName}" has been created.`,
      entityType: 'Project',
      entityId: event.entityId,
      priority: 'LOW',
      metadata: { action: 'CREATE', authorName: event.actorName },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'CREATE',
      module: 'projects',
      entityType: 'Project',
      entityId: event.entityId,
      newValues: event.newValues || null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('project.updated', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.actorId,
      type: 'content',
      title: 'Project Updated',
      message: `Project "${event.entityName}" has been updated.`,
      entityType: 'Project',
      entityId: event.entityId,
      priority: 'LOW',
      metadata: { action: 'UPDATE', changedFields: event.changedFields },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'UPDATE',
      module: 'projects',
      entityType: 'Project',
      entityId: event.entityId,
      oldValues: event.oldValues || null,
      newValues: event.newValues || null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('project.deleted', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'DELETE',
    module: 'projects',
    entityType: 'Project',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('project.published', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.actorId,
      type: 'content',
      title: 'Project Published',
      message: `Project "${event.entityName}" has been published.`,
      entityType: 'Project',
      entityId: event.entityId,
      priority: 'MEDIUM',
      metadata: { action: 'PUBLISH' },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'PUBLISH',
      module: 'projects',
      entityType: 'Project',
      entityId: event.entityId,
      newValues: { status: 'PUBLISHED' },
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('project.restored', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'RESTORE',
    module: 'projects',
    entityType: 'Project',
    entityId: event.entityId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('project.bulk_action', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: event.action.toUpperCase(),
    module: 'projects',
    entityType: 'Project',
    entityId: event.entityIds?.join(','),
    newValues: { count: event.count },
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('blog.created', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.authorId,
      type: 'content',
      title: 'Blog Post Created',
      message: `Blog post "${event.entityName}" has been created.`,
      entityType: 'Blog',
      entityId: event.entityId,
      priority: 'LOW',
      metadata: { action: 'CREATE' },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'CREATE',
      module: 'blogs',
      entityType: 'Blog',
      entityId: event.entityId,
      newValues: event.newValues || null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('blog.updated', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'UPDATE',
    module: 'blogs',
    entityType: 'Blog',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    newValues: event.newValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('blog.published', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.actorId,
      type: 'content',
      title: 'Blog Published',
      message: `Blog post "${event.entityName}" has been published.`,
      entityType: 'Blog',
      entityId: event.entityId,
      priority: 'MEDIUM',
      metadata: { action: 'PUBLISH' },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'PUBLISH',
      module: 'blogs',
      entityType: 'Blog',
      entityId: event.entityId,
      newValues: { status: 'PUBLISHED' },
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('blog.deleted', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'DELETE',
    module: 'blogs',
    entityType: 'Blog',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('blog.restored', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'RESTORE',
    module: 'blogs',
    entityType: 'Blog',
    entityId: event.entityId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('blog.bulk_action', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: event.action.toUpperCase(),
    module: 'blogs',
    entityType: 'Blog',
    entityId: event.entityIds?.join(','),
    newValues: { count: event.count },
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('media.uploaded', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.actorId,
      type: 'content',
      title: 'Media Uploaded',
      message: `File "${event.entityName}" has been uploaded.`,
      entityType: 'Media',
      entityId: event.entityId,
      priority: 'LOW',
      metadata: { action: 'UPLOAD', format: event.format, fileSize: event.fileSize },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'CREATE',
      module: 'media',
      entityType: 'Media',
      entityId: event.entityId,
      newValues: { fileName: event.entityName, format: event.format },
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('media.deleted', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'DELETE',
    module: 'media',
    entityType: 'Media',
    entityId: event.entityId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('media.updated', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'UPDATE',
    module: 'media',
    entityType: 'Media',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    newValues: event.newValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('media.bulk_action', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: event.action.toUpperCase(),
    module: 'media',
    entityType: 'Media',
    entityId: event.entityIds?.join(','),
    newValues: { count: event.count },
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('user.created', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.actorId,
      type: 'user',
      title: 'User Created',
      message: `User "${event.entityName}" has been created.`,
      entityType: 'User',
      entityId: event.entityId,
      priority: 'MEDIUM',
      metadata: { action: 'CREATE' },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'CREATE',
      module: 'users',
      entityType: 'User',
      entityId: event.entityId,
      newValues: event.newValues || null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('user.updated', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'UPDATE',
    module: 'users',
    entityType: 'User',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    newValues: event.newValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('user.deleted', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'DELETE',
    module: 'users',
    entityType: 'User',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('user.restored', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'RESTORE',
    module: 'users',
    entityType: 'User',
    entityId: event.entityId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('user.status_changed', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.actorId,
      type: 'user',
      title: 'User Status Changed',
      message: `User "${event.entityName}" status changed to ${event.newValues?.status}.`,
      entityType: 'User',
      entityId: event.entityId,
      priority: 'MEDIUM',
      metadata: { action: 'STATUS_CHANGE', oldStatus: event.oldValues?.status, newStatus: event.newValues?.status },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'UPDATE',
      module: 'users',
      entityType: 'User',
      entityId: event.entityId,
      oldValues: event.oldValues || null,
      newValues: event.newValues || null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('role.updated', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'UPDATE',
    module: 'roles',
    entityType: 'Role',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    newValues: event.newValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('role.created', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.actorId,
      type: 'system',
      title: 'Role Created',
      message: `Role "${event.entityName}" has been created.`,
      entityType: 'Role',
      entityId: event.entityId,
      priority: 'MEDIUM',
      metadata: { action: 'CREATE' },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'CREATE',
      module: 'roles',
      entityType: 'Role',
      entityId: event.entityId,
      newValues: event.newValues || null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('role.deleted', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'DELETE',
    module: 'roles',
    entityType: 'Role',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('role.cloned', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'CREATE',
    module: 'roles',
    entityType: 'Role',
    entityId: event.entityId,
    newValues: event.newValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('settings.updated', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    NotificationService.create({
      userId: event.actorId,
      type: 'system',
      title: 'Settings Updated',
      message: `System settings have been updated by ${event.actorName || 'a user'}.`,
      entityType: 'Setting',
      entityId: event.entityId,
      priority: 'MEDIUM',
      metadata: { action: 'UPDATE', changedKeys: event.changedKeys },
    }),
    AuditService.log({
      userId: event.actorId,
      action: 'UPDATE',
      module: 'settings',
      entityType: 'Setting',
      entityId: event.entityId,
      oldValues: event.oldValues || null,
      newValues: event.newValues || null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('headless_api_key.created', async (event) => {
  const { NotificationService } = await import('./NotificationService');
  const { AuditService } = await import('./AuditService');
  await Promise.all([
    AuditService.log({
      userId: event.actorId,
      action: 'CREATE',
      module: 'headless',
      entityType: 'HeadlessApiKey',
      entityId: event.entityId,
      newValues: event.newValues || null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }),
  ]);
});

EventService.on('headless_api_key.updated', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'UPDATE',
    module: 'headless',
    entityType: 'HeadlessApiKey',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    newValues: event.newValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('headless_api_key.deleted', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'DELETE',
    module: 'headless',
    entityType: 'HeadlessApiKey',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('headless_api_key.regenerated', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'REGENERATE',
    module: 'headless',
    entityType: 'HeadlessApiKey',
    entityId: event.entityId,
    newValues: event.newValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('headless_api_key.enabled', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'ENABLE',
    module: 'headless',
    entityType: 'HeadlessApiKey',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    newValues: event.newValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

EventService.on('headless_api_key.disabled', async (event) => {
  const { AuditService } = await import('./AuditService');
  await AuditService.log({
    userId: event.actorId,
    action: 'DISABLE',
    module: 'headless',
    entityType: 'HeadlessApiKey',
    entityId: event.entityId,
    oldValues: event.oldValues || null,
    newValues: event.newValues || null,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
});

} // end handlersRegistered guard
