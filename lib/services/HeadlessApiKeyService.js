import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { EventService } from './EventService';

const VALID_MODULES = ['projects', 'blogs', 'categories', 'media', 'settings'];

function generateApiKey() {
  return `tk_${crypto.randomBytes(32).toString('hex')}`;
}

function parseModules(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

export class HeadlessApiKeyService {
  static async findAll() {
    const keys = await prisma.headlessApiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => ({
      ...k,
      apiKey: `${k.apiKey.slice(0, 8)}...${k.apiKey.slice(-4)}`,
      apiKeyFull: k.apiKey,
      allowedModules: parseModules(k.allowedModules),
    }));
  }

  static async findById(id) {
    const key = await prisma.headlessApiKey.findUnique({ where: { id } });
    if (!key) throw new Error('API key not found');
    return {
      ...key,
      allowedModules: parseModules(key.allowedModules),
    };
  }

  static async create({ siteName, domain, enabled = true, allowedModules = [] }, metadata = {}) {
    const apiKey = generateApiKey();
    const validatedModules = this.validateModules(allowedModules);

    const key = await prisma.headlessApiKey.create({
      data: {
        siteName: siteName.trim(),
        domain: domain.trim(),
        apiKey,
        enabled,
        allowedModules: JSON.stringify(validatedModules),
      },
    });

    EventService.emit('headless_api_key.created', {
      actorId: metadata.actorId,
      entityId: key.id,
      entityName: key.siteName,
      newValues: { siteName: key.siteName, domain: key.domain, allowedModules: validatedModules, enabled },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return {
      ...key,
      allowedModules: validatedModules,
    };
  }

  static async update(id, { siteName, domain, enabled, allowedModules }, metadata = {}) {
    const existing = await this.findById(id);

    const updateData = {};
    if (siteName !== undefined) updateData.siteName = siteName.trim();
    if (domain !== undefined) updateData.domain = domain.trim();
    if (enabled !== undefined) updateData.enabled = enabled;
    if (allowedModules !== undefined) {
      updateData.allowedModules = JSON.stringify(this.validateModules(allowedModules));
    }

    const key = await prisma.headlessApiKey.update({
      where: { id },
      data: updateData,
    });

    EventService.emit('headless_api_key.updated', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: key.siteName,
      changedFields: Object.keys(updateData),
      oldValues: { ...existing, allowedModules: parseModules(existing.allowedModules) },
      newValues: { ...updateData, allowedModules: updateData.allowedModules ? this.validateModules(allowedModules) : undefined },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return {
      ...key,
      allowedModules: parseModules(key.allowedModules),
    };
  }

  static async toggleEnabled(id, metadata = {}) {
    const existing = await this.findById(id);
    const newEnabled = !existing.enabled;

    const key = await prisma.headlessApiKey.update({
      where: { id },
      data: { enabled: newEnabled },
    });

    const eventType = newEnabled ? 'headless_api_key.enabled' : 'headless_api_key.disabled';
    EventService.emit(eventType, {
      actorId: metadata.actorId,
      entityId: id,
      entityName: key.siteName,
      oldValues: { enabled: existing.enabled },
      newValues: { enabled: newEnabled, siteName: key.siteName, domain: key.domain },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return {
      ...key,
      allowedModules: parseModules(key.allowedModules),
    };
  }

  static async delete(id, metadata = {}) {
    const key = await this.findById(id);

    await prisma.headlessApiKey.delete({ where: { id } });

    EventService.emit('headless_api_key.deleted', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: key.siteName,
      oldValues: { siteName: key.siteName, domain: key.domain, allowedModules: parseModules(key.allowedModules) },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return { message: 'API key deleted successfully', siteName: key.siteName };
  }

  static async regenerateKey(id, metadata = {}) {
    const existing = await this.findById(id);
    const newApiKey = generateApiKey();

    const key = await prisma.headlessApiKey.update({
      where: { id },
      data: { apiKey: newApiKey },
    });

    EventService.emit('headless_api_key.regenerated', {
      actorId: metadata.actorId,
      entityId: id,
      entityName: key.siteName,
      newValues: { siteName: key.siteName, domain: key.domain, allowedModules: parseModules(existing.allowedModules) },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    }).catch(EventService.logError);

    return {
      ...key,
      allowedModules: parseModules(key.allowedModules),
    };
  }

  static async validateApiKey(apiKey, requiredModule) {
    if (!apiKey || typeof apiKey !== 'string') return { valid: false, reason: 'invalid' };

    const key = await prisma.headlessApiKey.findUnique({ where: { apiKey } });

    if (!key) return { valid: false, reason: 'invalid' };
    if (!key.enabled) return { valid: false, reason: 'disabled' };

    const modules = parseModules(key.allowedModules);
    if (requiredModule && !modules.includes(requiredModule)) {
      return { valid: false, reason: 'module_not_allowed' };
    }

    return { valid: true, key: { ...key, allowedModules: modules } };
  }

  static validateModules(modules) {
    if (!Array.isArray(modules)) return [];
    return modules.filter((m) => VALID_MODULES.includes(m));
  }

  static getValidModules() {
    return VALID_MODULES;
  }
}
