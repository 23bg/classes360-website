/**
 * AWS S3 Storage Provider (Future Implementation)
 *
 * This is a stub for future S3 support.
 * When implementing, follow the same interface as R2Provider.
 */

import type { StorageProvider, GetUploadUrlParams, GetUploadUrlResponse, DeleteFileParams } from '../types';

/**
 * S3 Provider Implementation (TODO)
 */
export const s3Provider: StorageProvider = {
  async getUploadUrl(params: GetUploadUrlParams): Promise<GetUploadUrlResponse> {
    throw new Error('S3 provider not yet implemented');
    // TODO: Implement S3 pre-signed URL generation
    // - Use AWS SDK v3 (@aws-sdk/client-s3)
    // - Generate presigned PUT URL
    // - Return public S3 URL
  },

  async deleteFile(params: DeleteFileParams): Promise<void> {
    throw new Error('S3 provider not yet implemented');
    // TODO: Implement S3 file deletion
  },

  async verify(): Promise<boolean> {
    throw new Error('S3 provider not yet implemented');
    // TODO: Verify S3 configuration
  },
};
