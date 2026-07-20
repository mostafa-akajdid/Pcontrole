import prisma from '@/lib/prisma';
import { EventService } from './EventService';

const GROUP_META = {
  general: { label: 'General', description: 'Basic site configuration' },
  branding: { label: 'Branding', description: 'Logo, favicon, and visual identity' },
  seo: { label: 'SEO', description: 'Search engine optimization defaults' },
  contact: { label: 'Contact', description: 'Company and contact information' },
  social: { label: 'Social Media', description: 'Social media profile links' },
  email: { label: 'Email', description: 'SMTP email configuration' },
  localization: { label: 'Localization', description: 'Language, timezone, and regional settings' },
  security: { label: 'Security', description: 'Authentication and security policies' },
  maintenance: { label: 'Maintenance', description: 'Maintenance mode configuration' },
  display: { label: 'Display', description: 'Pagination and display settings' },
};

const SENSITIVE_KEYS = ['smtpPassword'];

export class SettingsService {
  static async getAll(group = null) {
    const where = group ? { group } : {};

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    return this.toSettingsObject(settings);
  }

  static async getAllWithMeta(group = null) {
    const where = group ? { group } : {};

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    const grouped = {};
    settings.forEach((s) => {
      if (!grouped[s.group]) {
        grouped[s.group] = {
          ...(GROUP_META[s.group] || { label: s.group, description: '' }),
          settings: {},
        };
      }
      grouped[s.group].settings[s.key] = {
        value: SENSITIVE_KEYS.includes(s.key) ? '••••••••' : s.value,
        type: s.type,
        description: s.description,
        isSensitive: SENSITIVE_KEYS.includes(s.key),
      };
    });

    return grouped;
  }

  static async getGroup(group) {
    const settings = await prisma.setting.findMany({
      where: { group },
      orderBy: { key: 'asc' },
    });

    return {
      meta: GROUP_META[group] || { label: group, description: '' },
      settings: settings.reduce((acc, s) => {
        acc[s.key] = SENSITIVE_KEYS.includes(s.key) ? '••••••••' : s.value;
        return acc;
      }, {}),
      fields: settings.map((s) => ({
        key: s.key,
        value: SENSITIVE_KEYS.includes(s.key) ? '' : s.value,
        type: s.type,
        description: s.description,
        isSensitive: SENSITIVE_KEYS.includes(s.key),
      })),
    };
  }

  static async getRawGroup(group) {
    const settings = await prisma.setting.findMany({
      where: { group },
      orderBy: { key: 'asc' },
    });

    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
  }

  static async update(settings, userId = null, ipAddress = null, actorName = null) {
    const keys = settings.map((s) => s.key);
    const existing = await prisma.setting.findMany({
      where: { key: { in: keys } },
      select: { key: true, type: true },
    });
    const typeMap = {};
    existing.forEach((s) => { typeMap[s.key] = s.type; });

    const updates = settings.map(({ key, value }) => {
      const existingType = typeMap[key];
      const updateData = { value };
      if (existingType) {
        return prisma.setting.upsert({
          where: { key },
          update: updateData,
          create: { key, value, group: this.getGroupForKey(key), type: existingType },
        });
      }
      return prisma.setting.upsert({
        where: { key },
        update: updateData,
        create: { key, value, group: this.getGroupForKey(key), type: 'text' },
      });
    });

    await prisma.$transaction(updates);

    if (userId) {
      const groups = [...new Set(settings.map((s) => this.getGroupForKey(s.key)))];

      EventService.emit('settings.updated', {
        actorId: userId,
        actorName: actorName || null,
        entityId: groups.join(','),
        changedKeys: settings.map((s) => s.key),
        oldValues: null,
        newValues: settings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {}),
        ipAddress,
        userAgent: null,
      }).catch(EventService.logError);
    }

    return { message: 'Settings updated successfully' };
  }

  static async updateGroup(group, settings, userId = null, ipAddress = null, actorName = null) {
    const settingsWithGroup = settings.map((s) => ({ ...s, group }));
    return this.update(settingsWithGroup, userId, ipAddress, actorName);
  }

  static getGroupForKey(key) {
    const groupMap = {
      siteName: 'general', siteDescription: 'general', defaultLanguage: 'general',
      timezone: 'general', dateFormat: 'general', timeFormat: 'general',
      siteLogo: 'branding', siteFavicon: 'branding', adminLogo: 'branding',
      defaultPlaceholderImage: 'branding',
      defaultSeoTitle: 'seo', defaultSeoDescription: 'seo', defaultOgImage: 'seo',
      robots: 'seo', canonicalBaseUrl: 'seo', googleAnalyticsId: 'seo',
      companyName: 'contact', contactEmail: 'contact', contactPhone: 'contact',
      contactAddress: 'contact', googleMapsLink: 'contact',
      facebookUrl: 'social', twitterUrl: 'social', instagramUrl: 'social',
      linkedinUrl: 'social', youtubeUrl: 'social',
      smtpHost: 'email', smtpPort: 'email', smtpUsername: 'email',
      smtpPassword: 'email', smtpSenderName: 'email', smtpSenderEmail: 'email',
      localizationLanguage: 'localization', localizationTimezone: 'localization',
      firstDayOfWeek: 'localization', defaultCurrency: 'localization',
      sessionTimeout: 'security', maxLoginAttempts: 'security',
      passwordMinLength: 'security', passwordRequireUppercase: 'security',
      passwordRequireLowercase: 'security', passwordRequireNumber: 'security',
      allowRegistration: 'security', emailVerificationRequired: 'security',
      maintenanceMode: 'maintenance', maintenanceMessage: 'maintenance',
      maintenanceReturnDate: 'maintenance', maintenanceAllowAdmin: 'maintenance',
      projectsPerPage: 'display', blogsPerPage: 'display',
    };
    return groupMap[key] || 'general';
  }

  static async getSystemInfo() {
    const nodeVersion = process.version;
    const dbProvider = 'postgresql';
    let dbVersion = 'unknown';
    try {
      const result = await prisma.$queryRaw`SELECT version()`;
      dbVersion = result[0]?.version || 'unknown';
    } catch {
      dbVersion = 'unknown';
    }

    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    let smtpStatus = 'not_configured';
    const smtpHost = await prisma.setting.findUnique({ where: { key: 'smtpHost' } });
    if (smtpHost?.value) {
      smtpStatus = 'configured';
    }

    let cloudinaryStatus = 'not_configured';
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinaryStatus = 'configured';
    }

    return {
      version: '1.0.0',
      nodeVersion,
      databaseProvider: dbProvider,
      databaseVersion: dbVersion,
      environment: process.env.NODE_ENV || 'development',
      cloudinaryStatus,
      smtpStatus,
      databaseStatus: dbStatus,
    };
  }

  static async isMaintenanceMode() {
    const setting = await prisma.setting.findUnique({ where: { key: 'maintenanceMode' } });
    return setting?.value === 'true';
  }

  static async getMaintenanceInfo() {
    const [mode, message, returnDate, allowAdmin] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'maintenanceMode' } }),
      prisma.setting.findUnique({ where: { key: 'maintenanceMessage' } }),
      prisma.setting.findUnique({ where: { key: 'maintenanceReturnDate' } }),
      prisma.setting.findUnique({ where: { key: 'maintenanceAllowAdmin' } }),
    ]);

    return {
      enabled: mode?.value === 'true',
      message: message?.value || '',
      returnDate: returnDate?.value || null,
      allowAdmin: allowAdmin?.value !== 'false',
    };
  }

  static toSettingsObject(settings) {
    const obj = {};
    settings.forEach((s) => {
      obj[s.key] = SENSITIVE_KEYS.includes(s.key) ? '••••••••' : s.value;
    });
    return obj;
  }

  static async seedDefaults() {
    const defaultSettings = [
      { key: 'siteName', value: 'PIOLEC', group: 'general', type: 'text', description: 'The name of your site' },
      { key: 'siteDescription', value: 'Project Management Dashboard', group: 'general', type: 'textarea', description: 'A brief description of your site' },
      { key: 'defaultLanguage', value: 'en', group: 'general', type: 'select', description: 'Default language for the CMS' },
      { key: 'timezone', value: 'UTC', group: 'general', type: 'select', description: 'Default timezone' },
      { key: 'dateFormat', value: 'MMM d, yyyy', group: 'general', type: 'select', description: 'Default date format' },
      { key: 'timeFormat', value: 'hh:mm a', group: 'general', type: 'select', description: 'Default time format' },
      { key: 'siteLogo', value: '', group: 'branding', type: 'image', description: 'Site logo displayed in the header' },
      { key: 'siteFavicon', value: '', group: 'branding', type: 'image', description: 'Browser tab icon (favicon)' },
      { key: 'adminLogo', value: '', group: 'branding', type: 'image', description: 'Logo displayed in the admin sidebar' },
      { key: 'defaultPlaceholderImage', value: '', group: 'branding', type: 'image', description: 'Fallback image when no image is set' },
      { key: 'defaultSeoTitle', value: 'PIOLEC - Gestion de projets', group: 'seo', type: 'text', description: 'Default meta title for pages' },
      { key: 'defaultSeoDescription', value: 'Professional project management dashboard', group: 'seo', type: 'textarea', description: 'Default meta description for pages' },
      { key: 'defaultOgImage', value: '', group: 'seo', type: 'image', description: 'Default Open Graph image for social sharing' },
      { key: 'robots', value: 'index, follow', group: 'seo', type: 'text', description: 'Default robots directive' },
      { key: 'canonicalBaseUrl', value: '', group: 'seo', type: 'url', description: 'Canonical base URL' },
      { key: 'googleAnalyticsId', value: '', group: 'seo', type: 'text', description: 'Google Analytics tracking ID' },
      { key: 'companyName', value: '', group: 'contact', type: 'text', description: 'Company or organization name' },
      { key: 'contactEmail', value: 'admin@piolec.com', group: 'contact', type: 'email', description: 'Primary contact email' },
      { key: 'contactPhone', value: '', group: 'contact', type: 'text', description: 'Contact phone number' },
      { key: 'contactAddress', value: '', group: 'contact', type: 'textarea', description: 'Physical address' },
      { key: 'googleMapsLink', value: '', group: 'contact', type: 'url', description: 'Google Maps link' },
      { key: 'facebookUrl', value: '', group: 'social', type: 'url', description: 'Facebook page URL' },
      { key: 'twitterUrl', value: '', group: 'social', type: 'url', description: 'X (Twitter) profile URL' },
      { key: 'instagramUrl', value: '', group: 'social', type: 'url', description: 'Instagram profile URL' },
      { key: 'linkedinUrl', value: '', group: 'social', type: 'url', description: 'LinkedIn profile URL' },
      { key: 'youtubeUrl', value: '', group: 'social', type: 'url', description: 'YouTube channel URL' },
      { key: 'smtpHost', value: '', group: 'email', type: 'text', description: 'SMTP server hostname' },
      { key: 'smtpPort', value: '587', group: 'email', type: 'text', description: 'SMTP server port' },
      { key: 'smtpUsername', value: '', group: 'email', type: 'text', description: 'SMTP authentication username' },
      { key: 'smtpPassword', value: '', group: 'email', type: 'password', description: 'SMTP authentication password' },
      { key: 'smtpSenderName', value: '', group: 'email', type: 'text', description: 'Default sender name' },
      { key: 'smtpSenderEmail', value: '', group: 'email', type: 'email', description: 'Default sender email' },
      { key: 'localizationLanguage', value: 'en', group: 'localization', type: 'select', description: 'Display language' },
      { key: 'localizationTimezone', value: 'UTC', group: 'localization', type: 'select', description: 'Display timezone' },
      { key: 'firstDayOfWeek', value: 'monday', group: 'localization', type: 'select', description: 'First day of the week' },
      { key: 'defaultCurrency', value: 'USD', group: 'localization', type: 'select', description: 'Default currency' },
      { key: 'sessionTimeout', value: '60', group: 'security', type: 'number', description: 'Session timeout in minutes' },
      { key: 'maxLoginAttempts', value: '5', group: 'security', type: 'number', description: 'Max failed login attempts' },
      { key: 'passwordMinLength', value: '8', group: 'security', type: 'number', description: 'Minimum password length' },
      { key: 'passwordRequireUppercase', value: 'true', group: 'security', type: 'boolean', description: 'Require uppercase letters' },
      { key: 'passwordRequireLowercase', value: 'true', group: 'security', type: 'boolean', description: 'Require lowercase letters' },
      { key: 'passwordRequireNumber', value: 'true', group: 'security', type: 'boolean', description: 'Require numbers' },
      { key: 'allowRegistration', value: 'false', group: 'security', type: 'boolean', description: 'Allow new user registration' },
      { key: 'emailVerificationRequired', value: 'true', group: 'security', type: 'boolean', description: 'Require email verification' },
      { key: 'maintenanceMode', value: 'false', group: 'maintenance', type: 'boolean', description: 'Enable maintenance mode' },
      { key: 'maintenanceMessage', value: 'We are currently performing scheduled maintenance. Please check back later.', group: 'maintenance', type: 'textarea', description: 'Maintenance message' },
      { key: 'maintenanceReturnDate', value: '', group: 'maintenance', type: 'datetime-local', description: 'Expected return date' },
      { key: 'maintenanceAllowAdmin', value: 'true', group: 'maintenance', type: 'boolean', description: 'Allow admin access during maintenance' },
      { key: 'projectsPerPage', value: '12', group: 'display', type: 'number', description: 'Projects per page' },
      { key: 'blogsPerPage', value: '10', group: 'display', type: 'number', description: 'Blogs per page' },
    ];

    for (const setting of defaultSettings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { type: setting.type, description: setting.description },
        create: setting,
      });
    }

    return { message: 'Default settings seeded' };
  }
}
