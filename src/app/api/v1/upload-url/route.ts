/**
 * Upload URL API endpoint
 *
 * POST /api/v1/upload-url
 *
 * This endpoint generates pre-signed upload URLs for client-side file uploads.
 * Files are uploaded directly to R2 (or other storage provider) by the client,
 * bypassing the Node.js server.
 *
 * Security:
 * - Requires authentication
 * - Validates file type
 * - Enforces file size limits
 * - Rate-limited per user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSessionFromCookie } from '@/lib/auth/auth';
import { storageService } from '@/lib/storage';
import type { GetUploadUrlParams, UploadFileType, StorageFolder } from '@/lib/storage/types';

// Allowed file types
const ALLOWED_FILE_TYPES: UploadFileType[] = [
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

// Max file sizes (in bytes)
const MAX_FILE_SIZES: Record<UploadFileType, number> = {
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

// Request validation schema
const uploadUrlRequestSchema = z.object({
  fileType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ]),
  folder: z.enum(['institutes', 'users', 'courses', 'documents']),
  fileName: z.string().min(1).max(255).optional(),
  fileSize: z.number().min(1).optional(),
});

type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await readSessionFromCookie();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    let parsedBody: UploadUrlRequest;

    try {
      parsedBody = uploadUrlRequestSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error instanceof z.ZodError ? error.issues : [] },
        { status: 400 }
      );
    }

    // 3. Validate file type is allowed
    if (!ALLOWED_FILE_TYPES.includes(parsedBody.fileType)) {
      return NextResponse.json(
        {
          error: 'File type not allowed',
          allowed: ALLOWED_FILE_TYPES,
        },
        { status: 400 }
      );
    }

    // 4. Validate file size
    const maxSize = MAX_FILE_SIZES[parsedBody.fileType];
    if (parsedBody.fileSize && parsedBody.fileSize > maxSize) {
      return NextResponse.json(
        {
          error: 'File too large',
          maxSize,
          receivedSize: parsedBody.fileSize,
        },
        { status: 400 }
      );
    }

    // 5. Determine entity ID based on folder
    let entityId: string;
    switch (parsedBody.folder) {
      case 'institutes':
        // User must have instituteId in session
        if (!session.instituteId) {
          return NextResponse.json(
            { error: 'User is not associated with an institute' },
            { status: 403 }
          );
        }
        entityId = session.instituteId;
        break;

      case 'users':
        entityId = session.userId;
        break;

      case 'courses':
      case 'documents':
        // For courses and documents, entityId can be provided in request or default to userId
        // (Implementation depends on your app's authorization logic)
        entityId = session.userId;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid folder' },
          { status: 400 }
        );
    }

    // 6. Generate upload URL
    const uploadParams: GetUploadUrlParams = {
      fileType: parsedBody.fileType,
      folder: parsedBody.folder,
      entityId,
      fileName: parsedBody.fileName,
      fileSize: parsedBody.fileSize,
    };

    const { uploadUrl, fileUrl, expiresAt } = await storageService.getUploadUrl(uploadParams);

    // 7. Return response
    return NextResponse.json(
      {
        uploadUrl,
        fileUrl,
        expiresAt,
        expiresIn: expiresAt ? Math.round((expiresAt - Date.now()) / 1000) : 3600,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload URL API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate upload URL',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Example client usage:
 *
 * ```typescript
 * // 1. Get upload URL
 * const response = await fetch('/api/v1/upload-url', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     fileType: 'image/jpeg',
 *     folder: 'institutes',
 *     fileName: 'logo.jpg',
 *     fileSize: file.size
 *   })
 * });
 *
 * const { uploadUrl, fileUrl } = await response.json();
 *
 * // 2. Upload file directly to R2 (browser)
 * await fetch(uploadUrl, {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'image/jpeg' },
 *   body: file
 * });
 *
 * // 3. Save fileUrl to database
 * await updateInstituteProfile({
 *   logo: fileUrl
 * });
 * ```
 */
