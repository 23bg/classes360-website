/**
 * Cloudflare R2 Storage Provider
 *
 * Implements direct upload to R2 using pre-signed URLs.
 * - No files pass through the Node.js server
 * - Browser directly uploads to R2
 * - Client bandwidth is efficient
 */

import type { StorageProvider, GetUploadUrlParams, GetUploadUrlResponse, DeleteFileParams } from '../types';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucketName: string;
  bucketUrl: string; // Public R2 URL (e.g., https://bucket.123abc.r2.dev)
}

/**
 * Generate a unique filename
 */
function generateFileName(folder: string, entityId: string, fileName?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const originalName = fileName ? `-${fileName.replace(/[^a-zA-Z0-9.-]/g, '')}` : '';
  return `${folder}/${entityId}/${timestamp}-${random}${originalName}`;
}

/**
 * Get R2 configuration from environment variables
 */
function getR2Config(): R2Config {
  const config: R2Config = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.CLOUDFLARE_ACCESS_KEY_SECRET || '',
    bucketName: process.env.CLOUDFLARE_BUCKET_NAME || 'classes360',
    bucketUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || '',
  };

  if (!config.accountId || !config.accessKeyId || !config.accessKeySecret) {
    throw new Error('Missing required Cloudflare R2 configuration');
  }

  if (!config.bucketUrl) {
    // Fallback: construct from account ID and bucket name
    config.bucketUrl = `https://${config.bucketName}.${config.accountId}.r2.dev`;
  }

  return config;
}

/**
 * Generate AWS Signature v4 for R2
 */
async function generatePresignedUrl(
  config: R2Config,
  method: 'PUT' | 'GET' | 'DELETE',
  key: string,
  expirationSeconds: number = 3600
): Promise<string> {
  const crypto = require('crypto');

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\..+/, 'Z');
  const dateStamp = now.toISOString().split('T')[0].replace(/-/g, '');

  const host = `${config.bucketName}.${config.accountId}.r2.amazonaws.com`;
  const region = 'auto';
  const service = 's3';

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  // Construct canonical request
  const canonicalUri = `/${key}`;
  const canonicalQuerystring = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${encodeURIComponent(`${config.accessKeyId}/${credentialScope}`)}`,
    `X-Amz-Date=${amzDate}`,
    `X-Amz-Expires=${expirationSeconds}`,
    `X-Amz-SignedHeaders=host`,
  ]
    .sort()
    .join('&');

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    `host:${host}`,
    '',
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  // Create signature
  const canonicalRequestHash = crypto
    .createHash('sha256')
    .update(canonicalRequest)
    .digest('hex');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  const kDate = crypto
    .createHmac('sha256', `AWS4${config.accessKeySecret}`)
    .update(dateStamp)
    .digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();

  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign)
    .digest('hex');

  const finalQuerystring = `${canonicalQuerystring}&X-Amz-Signature=${signature}`;

  return `https://${host}/${key}?${finalQuerystring}`;
}

/**
 * R2 Storage Provider Implementation
 */
export const r2Provider: StorageProvider = {
  async getUploadUrl(params: GetUploadUrlParams): Promise<GetUploadUrlResponse> {
    try {
      const config = getR2Config();

      // Generate unique filename
      const fileName = generateFileName(params.folder, params.entityId, params.fileName);

      // Generate pre-signed PUT URL
      const uploadUrl = await generatePresignedUrl(config, 'PUT', fileName, 3600); // 1 hour

      // Construct public file URL
      const fileUrl = `${config.bucketUrl}/${fileName}`;

      return {
        uploadUrl,
        fileUrl,
        expiresAt: Date.now() + 3600 * 1000,
        metadata: {
          fileName,
          provider: 'r2',
          bucket: config.bucketName,
        },
      };
    } catch (error) {
      console.error('R2 getUploadUrl error:', error);
      throw new Error(`Failed to generate R2 upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async deleteFile(params: DeleteFileParams): Promise<void> {
    try {
      const config = getR2Config();

      // Extract key from fileUrl
      const urlObj = new URL(params.fileUrl);
      const key = urlObj.pathname.replace(/^\//, '');

      // Generate pre-signed DELETE URL
      const deleteUrl = await generatePresignedUrl(config, 'DELETE', key, 3600);

      // Execute DELETE request
      const response = await fetch(deleteUrl, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error(`R2 delete failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('R2 deleteFile error:', error);
      throw new Error(`Failed to delete R2 file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async verify(): Promise<boolean> {
    try {
      const config = getR2Config();
      // Simple verification: check if config is complete
      return !!(config.accountId && config.accessKeyId && config.accessKeySecret && config.bucketName);
    } catch {
      return false;
    }
  },
};
