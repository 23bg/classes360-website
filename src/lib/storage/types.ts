/**
 * Storage Provider Types
 *
 * This file defines the interface and types for all storage providers.
 * Providers (R2, S3, Cloudinary) must implement the StorageProvider interface.
 */

/**
 * Supported file types for upload
 */
export type UploadFileType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/svg+xml'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'text/csv';

/**
 * Supported storage folders for organizing files
 */
export type StorageFolder = 'institutes' | 'users' | 'courses' | 'documents';

/**
 * Request parameters for getting upload URL
 */
export interface GetUploadUrlParams {
  /** File MIME type (e.g., 'image/jpeg') */
  fileType: UploadFileType;

  /** Folder/path prefix for organizing files */
  folder: StorageFolder;

  /** ID of the entity owning this file (institute ID, user ID, etc.) */
  entityId: string;

  /** Original filename (optional, for reference) */
  fileName?: string;

  /** File size in bytes (optional, for validation) */
  fileSize?: number;
}

/**
 * Response from getting upload URL
 */
export interface GetUploadUrlResponse {
  /** Pre-signed URL where client can PUT/POST the file directly */
  uploadUrl: string;

  /** Public URL to access the file after upload */
  fileUrl: string;

  /** When the upload URL expires (timestamp) */
  expiresAt?: number;

  /** Additional metadata from provider */
  metadata?: Record<string, unknown>;
}

/**
 * Request parameters for deleting a file
 */
export interface DeleteFileParams {
  /** Public file URL to delete */
  fileUrl: string;

  /** Folder where file is stored */
  folder: StorageFolder;
}

/**
 * Generic storage provider interface
 * All storage providers must implement these methods
 */
export interface StorageProvider {
  /**
   * Get a pre-signed upload URL
   * Client will directly upload file to this URL (browser-based)
   */
  getUploadUrl(params: GetUploadUrlParams): Promise<GetUploadUrlResponse>;

  /**
   * Delete a file from storage
   * Optional - not all providers may support deletion
   */
  deleteFile?(params: DeleteFileParams): Promise<void>;

  /**
   * Verify provider is properly configured
   * Called during application startup
   */
  verify?(): Promise<boolean>;
}

/**
 * Storage service configuration
 */
export interface StorageConfig {
  /** Provider name (r2, s3, cloudinary) */
  provider: 'r2' | 's3' | 'cloudinary';

  /** Whether to enable storage features */
  enabled: boolean;

  /** Provider-specific configuration */
  config: Record<string, unknown>;
}
