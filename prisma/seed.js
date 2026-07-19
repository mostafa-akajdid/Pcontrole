import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Dashboard
  { name: 'dashboard.read', module: 'dashboard', action: 'read' },
  
  // Projects
  { name: 'projects.create', module: 'projects', action: 'create' },
  { name: 'projects.read', module: 'projects', action: 'read' },
  { name: 'projects.update', module: 'projects', action: 'update' },
  { name: 'projects.delete', module: 'projects', action: 'delete' },
  { name: 'projects.publish', module: 'projects', action: 'publish' },
  
  // Project Categories
  { name: 'project-categories.create', module: 'project-categories', action: 'create' },
  { name: 'project-categories.read', module: 'project-categories', action: 'read' },
  { name: 'project-categories.update', module: 'project-categories', action: 'update' },
  { name: 'project-categories.delete', module: 'project-categories', action: 'delete' },
  
  // Blogs
  { name: 'blogs.create', module: 'blogs', action: 'create' },
  { name: 'blogs.read', module: 'blogs', action: 'read' },
  { name: 'blogs.update', module: 'blogs', action: 'update' },
  { name: 'blogs.delete', module: 'blogs', action: 'delete' },
  { name: 'blogs.publish', module: 'blogs', action: 'publish' },
  
  // Blog Categories
  { name: 'blog-categories.create', module: 'blog-categories', action: 'create' },
  { name: 'blog-categories.read', module: 'blog-categories', action: 'read' },
  { name: 'blog-categories.update', module: 'blog-categories', action: 'update' },
  { name: 'blog-categories.delete', module: 'blog-categories', action: 'delete' },
  
  // Media
  { name: 'media.create', module: 'media', action: 'create' },
  { name: 'media.read', module: 'media', action: 'read' },
  { name: 'media.update', module: 'media', action: 'update' },
  { name: 'media.delete', module: 'media', action: 'delete' },
  { name: 'media.restore', module: 'media', action: 'restore' },
  
  // Users
  { name: 'users.create', module: 'users', action: 'create' },
  { name: 'users.read', module: 'users', action: 'read' },
  { name: 'users.update', module: 'users', action: 'update' },
  { name: 'users.delete', module: 'users', action: 'delete' },
  { name: 'users.restore', module: 'users', action: 'restore' },
  { name: 'users.manage', module: 'users', action: 'manage' },
  
  // Roles
  { name: 'roles.create', module: 'roles', action: 'create' },
  { name: 'roles.read', module: 'roles', action: 'read' },
  { name: 'roles.update', module: 'roles', action: 'update' },
  { name: 'roles.delete', module: 'roles', action: 'delete' },
  { name: 'roles.clone', module: 'roles', action: 'clone' },
  { name: 'roles.manage', module: 'roles', action: 'manage' },
  
  // Settings
  { name: 'settings.read', module: 'settings', action: 'read' },
  { name: 'settings.update', module: 'settings', action: 'update' },
  { name: 'settings.maintenance', module: 'settings', action: 'maintenance' },
  { name: 'settings.system-info', module: 'settings', action: 'system-info' },

  // Notifications
  { name: 'notifications.read', module: 'notifications', action: 'read' },
  { name: 'notifications.manage', module: 'notifications', action: 'manage' },
  { name: 'notifications.delete', module: 'notifications', action: 'delete' },

  // Audit Log
  { name: 'audit.view', module: 'audit', action: 'view' },
  { name: 'audit.export', module: 'audit', action: 'export' },
];

const ROLES = [
  { name: 'ADMIN', description: 'Full system access', isSystem: true },
  { name: 'EDITOR', description: 'Can manage all content', isSystem: true },
  { name: 'AUTHOR', description: 'Can create and edit own content', isSystem: true },
  { name: 'VIEWER', description: 'Read-only access', isSystem: true },
];

const DEFAULT_SETTINGS = [
  // General
  { key: 'siteName', value: 'TASKILY', group: 'general', type: 'text', description: 'The name of your site' },
  { key: 'siteDescription', value: 'Project Management Dashboard', group: 'general', type: 'textarea', description: 'A brief description of your site' },
  { key: 'defaultLanguage', value: 'en', group: 'general', type: 'select', description: 'Default language for the CMS' },
  { key: 'timezone', value: 'UTC', group: 'general', type: 'select', description: 'Default timezone' },
  { key: 'dateFormat', value: 'MMM d, yyyy', group: 'general', type: 'select', description: 'Default date format' },
  { key: 'timeFormat', value: 'hh:mm a', group: 'general', type: 'select', description: 'Default time format' },

  // Branding
  { key: 'siteLogo', value: '', group: 'branding', type: 'image', description: 'Site logo displayed in the header' },
  { key: 'siteFavicon', value: '', group: 'branding', type: 'image', description: 'Browser tab icon (favicon)' },
  { key: 'adminLogo', value: '', group: 'branding', type: 'image', description: 'Logo displayed in the admin sidebar' },
  { key: 'defaultPlaceholderImage', value: '', group: 'branding', type: 'image', description: 'Fallback image when no image is set' },

  // SEO
  { key: 'defaultSeoTitle', value: 'TASKILY - Project Management CMS', group: 'seo', type: 'text', description: 'Default meta title for pages' },
  { key: 'defaultSeoDescription', value: 'Professional project management dashboard', group: 'seo', type: 'textarea', description: 'Default meta description for pages' },
  { key: 'defaultOgImage', value: '', group: 'seo', type: 'image', description: 'Default Open Graph image for social sharing' },
  { key: 'robots', value: 'index, follow', group: 'seo', type: 'text', description: 'Default robots directive' },
  { key: 'canonicalBaseUrl', value: '', group: 'seo', type: 'url', description: 'Canonical base URL (e.g., https://example.com)' },
  { key: 'googleAnalyticsId', value: '', group: 'seo', type: 'text', description: 'Google Analytics tracking ID' },

  // Contact
  { key: 'companyName', value: '', group: 'contact', type: 'text', description: 'Company or organization name' },
  { key: 'contactEmail', value: 'admin@taskily.com', group: 'contact', type: 'email', description: 'Primary contact email' },
  { key: 'contactPhone', value: '', group: 'contact', type: 'text', description: 'Contact phone number' },
  { key: 'contactAddress', value: '', group: 'contact', type: 'textarea', description: 'Physical address' },
  { key: 'googleMapsLink', value: '', group: 'contact', type: 'url', description: 'Google Maps link for your location' },

  // Social
  { key: 'facebookUrl', value: '', group: 'social', type: 'url', description: 'Facebook page URL' },
  { key: 'twitterUrl', value: '', group: 'social', type: 'url', description: 'X (Twitter) profile URL' },
  { key: 'instagramUrl', value: '', group: 'social', type: 'url', description: 'Instagram profile URL' },
  { key: 'linkedinUrl', value: '', group: 'social', type: 'url', description: 'LinkedIn profile URL' },
  { key: 'youtubeUrl', value: '', group: 'social', type: 'url', description: 'YouTube channel URL' },

  // Email (SMTP)
  { key: 'smtpHost', value: '', group: 'email', type: 'text', description: 'SMTP server hostname' },
  { key: 'smtpPort', value: '587', group: 'email', type: 'text', description: 'SMTP server port' },
  { key: 'smtpUsername', value: '', group: 'email', type: 'text', description: 'SMTP authentication username' },
  { key: 'smtpPassword', value: '', group: 'email', type: 'password', description: 'SMTP authentication password' },
  { key: 'smtpSenderName', value: '', group: 'email', type: 'text', description: 'Default sender name for emails' },
  { key: 'smtpSenderEmail', value: '', group: 'email', type: 'email', description: 'Default sender email address' },

  // Localization
  { key: 'localizationLanguage', value: 'en', group: 'localization', type: 'select', description: 'Display language' },
  { key: 'localizationTimezone', value: 'UTC', group: 'localization', type: 'select', description: 'Display timezone' },
  { key: 'firstDayOfWeek', value: 'monday', group: 'localization', type: 'select', description: 'First day of the week' },
  { key: 'defaultCurrency', value: 'USD', group: 'localization', type: 'select', description: 'Default currency for future e-commerce' },

  // Security
  { key: 'sessionTimeout', value: '60', group: 'security', type: 'number', description: 'Session timeout in minutes' },
  { key: 'maxLoginAttempts', value: '5', group: 'security', type: 'number', description: 'Maximum failed login attempts before lockout' },
  { key: 'passwordMinLength', value: '8', group: 'security', type: 'number', description: 'Minimum password length' },
  { key: 'passwordRequireUppercase', value: 'true', group: 'security', type: 'boolean', description: 'Require uppercase letters in passwords' },
  { key: 'passwordRequireLowercase', value: 'true', group: 'security', type: 'boolean', description: 'Require lowercase letters in passwords' },
  { key: 'passwordRequireNumber', value: 'true', group: 'security', type: 'boolean', description: 'Require numbers in passwords' },
  { key: 'allowRegistration', value: 'false', group: 'security', type: 'boolean', description: 'Allow new user registration' },
  { key: 'emailVerificationRequired', value: 'true', group: 'security', type: 'boolean', description: 'Require email verification for new users' },

  // Maintenance
  { key: 'maintenanceMode', value: 'false', group: 'maintenance', type: 'boolean', description: 'Enable maintenance mode' },
  { key: 'maintenanceMessage', value: 'We are currently performing scheduled maintenance. Please check back later.', group: 'maintenance', type: 'textarea', description: 'Message shown during maintenance' },
  { key: 'maintenanceReturnDate', value: '', group: 'maintenance', type: 'datetime-local', description: 'Expected return date and time' },
  { key: 'maintenanceAllowAdmin', value: 'true', group: 'maintenance', type: 'boolean', description: 'Allow admin access during maintenance' },

  // Display
  { key: 'projectsPerPage', value: '12', group: 'display', type: 'number', description: 'Projects per page in listing' },
  { key: 'blogsPerPage', value: '10', group: 'display', type: 'number', description: 'Blogs per page in listing' },
];

async function main() {
  console.log('Seeding database...\n');

  // 1. Create Permissions
  console.log('Creating permissions...');
  const permissionMap = {};
  for (const perm of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    permissionMap[perm.name] = created.id;
    console.log(`  ✓ Permission: ${perm.name}`);
  }

  // 2. Create Roles
  console.log('\nCreating roles...');
  const roleMap = {};
  
  for (const role of ROLES) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });
    roleMap[role.name] = created.id;
    console.log(`  ✓ Role: ${role.name}`);
  }

  // 3. Assign permissions to roles
  console.log('\nAssigning permissions to roles...');
  
  // Admin gets all permissions
  await prisma.role.update({
    where: { id: roleMap['ADMIN'] },
    data: {
      permissions: {
        set: PERMISSIONS.map(p => ({ id: permissionMap[p.name] })),
      },
    },
  });
  console.log('  ✓ ADMIN: All permissions');

  // Editor gets everything except roles management, user management, and maintenance
  const editorPermNames = PERMISSIONS.filter(p => 
    !p.name.startsWith('roles.') && 
    !p.name.startsWith('users.manage') &&
    !p.name.startsWith('users.restore') &&
    !p.name.startsWith('users.delete') &&
    p.name !== 'settings.maintenance' &&
    p.name !== 'audit.view' &&
    p.name !== 'audit.export'
  ).map(p => p.name);
  await prisma.role.update({
    where: { id: roleMap['EDITOR'] },
    data: {
      permissions: {
        set: editorPermNames.map(name => ({ id: permissionMap[name] })),
      },
    },
  });
  console.log('  ✓ EDITOR: Content permissions (no role management)');

  // Author gets create/read/update for own content + notifications
  const authorPermNames = [
    'dashboard.read',
    'projects.create', 'projects.read', 'projects.update',
    'blogs.create', 'blogs.read', 'blogs.update',
    'media.create', 'media.read', 'media.update',
    'project-categories.read',
    'blog-categories.read',
    'settings.read',
    'notifications.read',
  ];
  await prisma.role.update({
    where: { id: roleMap['AUTHOR'] },
    data: {
      permissions: {
        set: authorPermNames.map(name => ({ id: permissionMap[name] })),
      },
    },
  });
  console.log('  ✓ AUTHOR: Content creation permissions');

  // Viewer gets read-only access + notifications
  const viewerPermNames = [
    'dashboard.read',
    'projects.read',
    'blogs.read',
    'media.read',
    'project-categories.read',
    'blog-categories.read',
    'settings.read',
    'notifications.read',
  ];
  await prisma.role.update({
    where: { id: roleMap['VIEWER'] },
    data: {
      permissions: {
        set: viewerPermNames.map(name => ({ id: permissionMap[name] })),
      },
    },
  });
  console.log('  ✓ VIEWER: Read-only permissions');

  // 4. Create default admin user
  console.log('\nCreating admin user...');
  const adminEmail = 'admin@taskily.com';
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      roleId: roleMap['ADMIN'],
      emailVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Admin user: ${adminEmail} / Admin123!`);

  // 5. Create default settings
  console.log('\nCreating default settings...');
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { type: setting.type, description: setting.description },
      create: setting,
    });
  }
  console.log(`  ✓ ${DEFAULT_SETTINGS.length} default settings created`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@taskily.com');
  console.log('  Password: Admin123!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
