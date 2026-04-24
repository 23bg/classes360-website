const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

const IMAGE_MIME_PREFIX = "image/";

export type FileValidationResult = {
    isValid: boolean;
    error?: string;
};

export function isImageFile(file: File): boolean {
    return file.type.startsWith(IMAGE_MIME_PREFIX);
}

export function validateFile(file: File, maxFileSize = DEFAULT_MAX_FILE_SIZE): FileValidationResult {
    if (!file) {
        return { isValid: false, error: "No file selected" };
    }

    if (file.size <= 0) {
        return { isValid: false, error: "Selected file is empty" };
    }

    if (file.size > maxFileSize) {
        const limitMb = Math.round(maxFileSize / (1024 * 1024));
        return { isValid: false, error: `File size must be less than ${limitMb}MB` };
    }

    return { isValid: true };
}
