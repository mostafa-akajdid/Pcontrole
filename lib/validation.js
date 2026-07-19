import { z } from 'zod';

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 characters'),
});

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.string().url('Invalid URL').optional().nullable(),
  roleId: z.string().uuid('Invalid role ID').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// =============================================================================
// ROLE SCHEMAS
// =============================================================================

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const cloneRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').optional(),
});

// =============================================================================
// USER MANAGEMENT SCHEMAS
// =============================================================================

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  roleId: z.string().uuid('Invalid role ID'),
  phone: z.string().max(50).optional().nullable(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
  avatar: z.string().url('Invalid URL').optional().nullable(),
});

export const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const forcePasswordChangeSchema = z.object({
  enabled: z.boolean(),
});

export const userBulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one user must be selected').max(100),
  action: z.enum(['activate', 'deactivate', 'suspend', 'delete', 'restore']),
});

// =============================================================================
// SETTINGS SCHEMAS
// =============================================================================

export const updateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string().min(1, 'Key is required').max(100, 'Key must be less than 100 characters'),
    value: z.string().max(10000, 'Value must be less than 10000 characters'),
  })),
});

// General settings
export const generalSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(100, 'Site name must be less than 100 characters').optional(),
  siteDescription: z.string().max(500, 'Description must be less than 500 characters').optional(),
  defaultLanguage: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
});

// Branding settings
export const brandingSettingsSchema = z.object({
  siteLogo: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  siteFavicon: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  adminLogo: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  defaultPlaceholderImage: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
});

// SEO settings
export const seoSettingsSchema = z.object({
  defaultSeoTitle: z.string().max(200, 'Title must be less than 200 characters').optional(),
  defaultSeoDescription: z.string().max(500, 'Description must be less than 500 characters').optional(),
  defaultOgImage: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  robots: z.string().max(100).optional(),
  canonicalBaseUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  googleAnalyticsId: z.string().max(50).optional(),
});

// Contact settings
export const contactSettingsSchema = z.object({
  companyName: z.string().max(200, 'Company name must be less than 200 characters').optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().max(50).optional(),
  contactAddress: z.string().max(500).optional(),
  googleMapsLink: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
});

// Social settings
export const socialSettingsSchema = z.object({
  facebookUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  twitterUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  instagramUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  youtubeUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
});

// Email settings
export const emailSettingsSchema = z.object({
  smtpHost: z.string().max(200).optional(),
  smtpPort: z.string().regex(/^\d+$/, 'Port must be a number').optional(),
  smtpUsername: z.string().max(200).optional(),
  smtpPassword: z.string().max(200).optional(),
  smtpSenderName: z.string().max(100).optional(),
  smtpSenderEmail: z.string().email('Invalid email').optional().or(z.literal('')),
});

// Localization settings
export const localizationSettingsSchema = z.object({
  localizationLanguage: z.string().optional(),
  localizationTimezone: z.string().optional(),
  firstDayOfWeek: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']).optional(),
  defaultCurrency: z.string().length(3, 'Currency must be 3 characters').optional(),
});

// Security settings
export const securitySettingsSchema = z.object({
  sessionTimeout: z.string().regex(/^\d+$/, 'Must be a number').optional(),
  maxLoginAttempts: z.string().regex(/^\d+$/, 'Must be a number').optional(),
  passwordMinLength: z.string().regex(/^\d+$/, 'Must be a number').optional(),
  passwordRequireUppercase: z.enum(['true', 'false']).optional(),
  passwordRequireLowercase: z.enum(['true', 'false']).optional(),
  passwordRequireNumber: z.enum(['true', 'false']).optional(),
  allowRegistration: z.enum(['true', 'false']).optional(),
  emailVerificationRequired: z.enum(['true', 'false']).optional(),
});

// Maintenance settings
export const maintenanceSettingsSchema = z.object({
  maintenanceMode: z.enum(['true', 'false']).optional(),
  maintenanceMessage: z.string().max(1000).optional(),
  maintenanceReturnDate: z.string().optional().nullable(),
  maintenanceAllowAdmin: z.enum(['true', 'false']).optional(),
});

// Display settings
export const displaySettingsSchema = z.object({
  projectsPerPage: z.string().regex(/^\d+$/, 'Must be a number').optional(),
  blogsPerPage: z.string().regex(/^\d+$/, 'Must be a number').optional(),
});

// SMTP test schema
export const smtpTestSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
});

// =============================================================================
// PROJECT SCHEMAS
// =============================================================================

const projectImageObject = z.object({
  url: z.string().url('Invalid image URL'),
  publicId: z.string().optional(),
  altText: z.string().max(200).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  shortDescription: z.string().max(500, 'Short description must be less than 500 characters').optional(),
  fullDescription: z.string().optional(),
  coverImage: z.string().url('Invalid URL').optional().nullable(),
  featured: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  client: z.string().max(200, 'Client must be less than 200 characters').optional().nullable(),
  location: z.string().max(200, 'Location must be less than 200 characters').optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  metaTitle: z.string().max(200, 'Meta title must be less than 200 characters').optional().nullable(),
  metaDescription: z.string().max(500, 'Meta description must be less than 500 characters').optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
  images: z.array(projectImageObject).max(50, 'Maximum 50 images allowed').optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  shortDescription: z.string().max(500, 'Short description must be less than 500 characters').optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  coverImage: z.string().url('Invalid URL').optional().nullable(),
  featured: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  client: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export const projectBulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one project must be selected').max(100, 'Maximum 100 projects per batch'),
  action: z.enum(['publish', 'unpublish', 'delete', 'restore', 'permanentDelete', 'feature', 'unfeature']),
});

export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1, 'At least one image ID is required'),
});

export const setCoverImageSchema = z.object({
  imageId: z.string().uuid('Invalid image ID'),
});

// =============================================================================
// PROJECT CATEGORY SCHEMAS
// =============================================================================

export const createProjectCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
});

export const updateProjectCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(500).optional().nullable(),
});

export const projectImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  publicId: z.string().optional(),
  altText: z.string().max(200).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

// =============================================================================
// BLOG SCHEMAS
// =============================================================================

const blogImageObject = z.object({
  url: z.string().url('Invalid image URL'),
  publicId: z.string().optional(),
  altText: z.string().max(200).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().max(200, 'Slug must be less than 200 characters').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
  content: z.string().optional(),
  coverImage: z.string().url('Invalid URL').optional().nullable(),
  featured: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  metaTitle: z.string().max(200, 'Meta title must be less than 200 characters').optional().nullable(),
  metaDescription: z.string().max(500, 'Meta description must be less than 500 characters').optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
  images: z.array(blogImageObject).max(50, 'Maximum 50 images allowed').optional(),
});

export const updateBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional().nullable(),
  content: z.string().optional().nullable(),
  coverImage: z.string().url('Invalid URL').optional().nullable(),
  featured: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export const blogBulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one blog must be selected').max(100, 'Maximum 100 blogs per batch'),
  action: z.enum(['publish', 'unpublish', 'delete', 'restore', 'permanentDelete', 'feature', 'unfeature']),
});

export const blogImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  publicId: z.string().optional(),
  altText: z.string().max(200).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

// =============================================================================
// BLOG CATEGORY SCHEMAS
// =============================================================================

export const createBlogCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
});

export const updateBlogCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(500).optional().nullable(),
});

// =============================================================================
// MEDIA SCHEMAS
// =============================================================================

export const updateMediaSchema = z.object({
  altText: z.string().max(200, 'Alt text must be less than 200 characters').optional().nullable(),
  caption: z.string().max(500, 'Caption must be less than 500 characters').optional().nullable(),
  fileName: z.string().min(1, 'File name is required').max(200, 'File name must be less than 200 characters').optional(),
  folder: z.string().max(100, 'Folder must be less than 100 characters').optional(),
});

export const mediaBulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one file must be selected').max(100, 'Maximum 100 files per batch'),
  action: z.enum(['delete', 'restore', 'move', 'updateAltText', 'updateCaption']),
  folder: z.string().max(100).optional(),
  metadata: z.object({
    altText: z.string().max(200).optional().nullable(),
    caption: z.string().max(500).optional().nullable(),
  }).optional(),
});

export const uploadMediaSchema = z.object({
  url: z.string().url('Invalid URL').optional(),
  altText: z.string().max(200).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  folder: z.string().max(100).optional(),
});

// =============================================================================
// VALIDATION HELPER
// =============================================================================

export function validateRequest(schema, data) {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return { success: false, errors };
}
