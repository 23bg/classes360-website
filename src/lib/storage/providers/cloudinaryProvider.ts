/**
 * Cloudinary Storage Provider (Future Implementation)
 *
 * This is a stub for future Cloudinary support.
 * When implementing, follow the same interface as R2Provider.
 */

import type { StorageProvider, GetUploadUrlParams, GetUploadUrlResponse, DeleteFileParams } from '../types';

/**
 * Cloudinary Provider Implementation (TODO)
 */
export const cloudinaryProvider: StorageProvider = {
  async getUploadUrl(params: GetUploadUrlParams): Promise<GetUploadUrlResponse> {
    throw new Error('Cloudinary provider not yet implemented');
    // TODO: Implement Cloudinary upload
    // - Generate Cloudinary upload signature
    // - Return upload endpoint URL
    // - Provide public delivery URL
    // - Support transformations (resize, optimize, etc.)
  },

  async deleteFile(params: DeleteFileParams): Promise<void> {
    throw new Error('Cloudinary provider not yet implemented');
    // TODO: Implement Cloudinary file deletion
  },

  async verify(): Promise<boolean> {
    throw new Error('Cloudinary provider not yet implemented');
    // TODO: Verify Cloudinary configuration
  },
};
