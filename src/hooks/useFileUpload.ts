/**
 * React Hook for File Uploads
 *
 * Handles the complete flow:
 * 1. Request upload URL from API
 * 2. Upload file directly to storage provider
 * 3. Return public file URL
 *
 * Usage:
 * ```tsx
 * const { uploadFile, isLoading, error } = useFileUpload();
 *
 * const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (!file) return;
 *
 *   const fileUrl = await uploadFile(file, 'institutes', 'logo.jpg');
 *   setInstituteLogo(fileUrl);
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import api from '@/lib/api/client';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseFileUploadOptions {
  /** Callback when upload progress updates */
  onProgress?: (progress: UploadProgress) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Callback on success */
  onSuccess?: (fileUrl: string) => void;
}

export function useFileUpload(options?: UseFileUploadOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const uploadFile = useCallback(
    async (
      file: File,
      folder: 'institutes' | 'users' | 'courses' | 'documents',
      fileName?: string
    ): Promise<string> => {
      try {
        setIsLoading(true);
        setError(null);
        setProgress(null);

        // Step 1: Request upload URL using the project's axios instance
        const uploadResp = await api.post('/upload-url', {
          fileType: file.type,
          folder,
          fileName: fileName || file.name,
          fileSize: file.size,
        });

        const { uploadUrl, fileUrl } = uploadResp.data;

        // Step 2: Upload file directly to storage provider
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        setIsLoading(false);
        const finalProgress = { loaded: file.size, total: file.size, percentage: 100 };
        setProgress(finalProgress);
        options?.onProgress?.(finalProgress);

        options?.onSuccess?.(fileUrl);

        return fileUrl;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);

        options?.onError?.(error);

        throw error;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    setProgress(null);
  }, []);

  return {
    uploadFile,
    isLoading,
    error,
    progress,
    reset,
  };
}
