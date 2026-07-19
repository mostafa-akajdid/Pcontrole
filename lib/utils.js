import crypto from 'crypto';

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function generateUniqueSlug(slug, existingSlugs = []) {
  let uniqueSlug = slug;
  let counter = 1;
  
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
}

export function truncate(str, length = 100, suffix = '...') {
  if (!str || str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function generateRandomCode(length = 6) {
  const chars = '0123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomBytes[i] % chars.length);
  }
  return result;
}

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];
export const VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi'];
export const DOCUMENT_FORMATS = ['pdf', 'doc', 'docx', 'txt'];

export function isImageFormat(format) {
  return IMAGE_FORMATS.includes(format?.toLowerCase());
}

export function isVideoFormat(format) {
  return VIDEO_FORMATS.includes(format?.toLowerCase());
}

export function getFormatIcon(format) {
  const f = format?.toLowerCase() || '';
  if (IMAGE_FORMATS.includes(f)) return 'image';
  if (VIDEO_FORMATS.includes(f)) return 'film';
  if (DOCUMENT_FORMATS.includes(f)) return 'file-text';
  return 'file';
}

// =============================================================================
// SETTINGS CONSTANTS
// =============================================================================

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'id', label: 'Indonesian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];
