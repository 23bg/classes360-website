/**
 * File Upload Utilities & Validation
 *
 * Shared utilities for file upload validation across the application.
 */

import type { UploadFileType } from './types';

/**
 * Supported file types for upload
 */
export const SUPPORTED_FILE_TYPES: readonly UploadFileType[] = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',

  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // CSV
  'text/csv',
];

/**
 * Human-readable file type names
 */
export const FILE_TYPE_NAMES: Record<UploadFileType, string> = {
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'image/webp': 'WebP Image',
  'image/svg+xml': 'SVG Image',
  'application/pdf': 'PDF Document',
  'application/msword': 'Word Document (DOC)',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (DOCX)',
  'application/vnd.ms-excel': 'Excel Spreadsheet (XLS)',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet (XLSX)',
  'text/csv': 'CSV (Comma-separated values)',
};

/**
 * Maximum file sizes by type (in bytes)
 */
export const MAX_FILE_SIZES: Record<UploadFileType, number> = {
  // Images
  'image/jpeg': 2 * 1024 * 1024, // 2MB
  'image/png': 2 * 1024 * 1024, // 2MB
  'image/webp': 2 * 1024 * 1024, // 2MB
  'image/svg+xml': 1 * 1024 * 1024, // 1MB

  // Documents
  'application/pdf': 10 * 1024 * 1024, // 10MB
  'application/msword': 10 * 1024 * 1024, // 10MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024, // 10MB

  // Excel
  'application/vnd.ms-excel': 5 * 1024 * 1024, // 5MB
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 5 * 1024 * 1024, // 5MB

  // CSV
  'text/csv': 2 * 1024 * 1024, // 2MB
};

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check if file type is supported
  if (!SUPPORTED_FILE_TYPES.includes(file.type as UploadFileType)) {
    return {
      isValid: false,
      error: `File type not supported. Supported types: ${Object.values(FILE_TYPE_NAMES).join(', ')}`,
    };
  }

  // Check file size
  const maxSize = MAX_FILE_SIZES[file.type as UploadFileType];
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File is too large. Maximum size: ${formatFileSize(maxSize)}`,
    };
  }

  return { isValid: true };
}

/**
 * Get file type from File object
 */
export function getFileType(file: File): UploadFileType | null {
  if (SUPPORTED_FILE_TYPES.includes(file.type as UploadFileType)) {
    return file.type as UploadFileType;
  }
  return null;
}

/**
 * Generate unique filename from File object
 */
export function generateUniqueFileName(file: File, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const ext = file.name.split('.').pop() || 'bin';
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace invalid chars
    .slice(0, 50); // Limit length

  return `${prefix ? prefix + '-' : ''}${timestamp}-${random}-${cleanName}.${ext}`;
}

/**
 * Extract extension from filename or MIME type
 */
export function getFileExtension(fileNameOrType: string): string {
  // If it's a MIME type
  if (fileNameOrType.includes('/')) {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/csv': 'csv',
    };
    return mimeToExt[fileNameOrType] || 'bin';
  }

  // If it's a filename
  const parts = fileNameOrType.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') && SUPPORTED_FILE_TYPES.includes(file.type as UploadFileType);
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Create a data URL from file (for preview)
 * WARNING: Only use for small files or preview purposes
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Create an image preview
 */
export async function createImagePreview(file: File): Promise<{ url: string; width: number; height: number } | null> {
  if (!isImageFile(file)) {
    return null;
  }

  const dataUrl = await fileToDataUrl(file);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        url: dataUrl,
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
