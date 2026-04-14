/**
 * Storage Service Wrapper
 *
 * This is the main entry point for all storage operations.
 * Business logic should ONLY use this service, never directly use providers.
 *
 * To change storage provider: update STORAGE_PROVIDER environment variable
 * No other code changes needed!
 */

import type { StorageProvider, GetUploadUrlParams, GetUploadUrlResponse, DeleteFileParams } from './types';
import { r2Provider } from './providers/r2Provider';

/**
 * Get the active storage provider based on environment configuration
 */
function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase() || 'r2';

  switch (provider) {
    case 'r2':
      return r2Provider;

    // Future providers can be added here:
    // case 's3':
    //   return s3Provider;
    // case 'cloudinary':
    //   return cloudinaryProvider;

    default:
      console.warn(`Unknown storage provider: ${provider}, defaulting to R2`);
      return r2Provider;
  }
}

/**
 * Storage Service
 * Provider-agnostic interface for all file storage operations
 */
export const storageService = {
  /**
   * Get a pre-signed upload URL
   *
   * Usage:
   * ```ts
   * const { uploadUrl, fileUrl } = await storageService.getUploadUrl({
   *   fileType: 'image/jpeg',
   *   folder: 'institutes',
   *   entityId: instituteId,
   *   fileName: 'logo.jpg'
   * });
   *
   * // Client sends file directly to uploadUrl via PUT request
   * // Then stores fileUrl in database
   * ```
   */
  async getUploadUrl(params: GetUploadUrlParams): Promise<GetUploadUrlResponse> {
    const provider = getStorageProvider();
    return provider.getUploadUrl(params);
  },

  /**
   * Delete a file from storage
   *
   * Usage:
   * ```ts
   * await storageService.deleteFile({
   *   fileUrl: institute.logo,
   *   folder: 'institutes'
   * });
   * ```
   */
  async deleteFile(params: DeleteFileParams): Promise<void> {
    const provider = getStorageProvider();

    if (provider.deleteFile) {
      return provider.deleteFile(params);
    }

    // If provider doesn't support deletion, log warning
    console.warn(`Storage provider does not support file deletion: ${params.fileUrl}`);
  },

  /**
   * Verify storage provider is configured correctly
   */
  async verify(): Promise<boolean> {
    const provider = getStorageProvider();

    if (provider.verify) {
      return provider.verify();
    }

    return true; // Assume OK if no verification method
  },

  /**
   * Get name of currently active provider
   */
  getActiveProvider(): string {
    return process.env.STORAGE_PROVIDER?.toLowerCase() || 'r2';
  },
};

/**
 * Initialize storage service on app startup
 */
export async function initializeStorageService(): Promise<void> {
  try {
    const isValid = await storageService.verify();

    if (!isValid) {
      console.error('Storage provider verification failed!');
      process.exit(1);
    }

    console.log(`✓ Storage service initialized with provider: ${storageService.getActiveProvider()}`);
  } catch (error) {
    console.error('Failed to initialize storage service:', error);
    process.exit(1);
  }
}
