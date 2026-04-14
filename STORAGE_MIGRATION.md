# Migration Guide: Updating Components to Use Storage Service

This guide explains how to update existing form components to use the new pluggable storage system.

## 🎯 Overview

**Before**: Forms handled image/file inputs manually or relied on external storage
**After**: Use `useFileUpload` hook + `storageService` for provider-agnostic uploads

## 📝 Step-by-Step Migration

### Step 1: Replace Manual Upload Logic

**OLD:**
```typescript
// ❌ Direct file handling
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  const formData = new FormData();
  formData.append('file', file);
  
  // Manual upload
  fetch('/api/upload', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(d => setImageUrl(d.url));
};
```

**NEW:**
```typescript
// ✓ Use the hook
import { useFileUpload } from '@/hooks/useFileUpload';

const { uploadFile, isLoading, error } = useFileUpload({
  onSuccess: (fileUrl) => setImageUrl(fileUrl),
});

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) await uploadFile(file, 'institutes');
};
```

### Step 2: Add Validation

**OLD:**
```typography
// ❌ No validation or loose validation
const handleFileChange = (e) => {
  const file = e.target.files?.[0];
  uploadFile(file); // No checks!
};
```

**NEW:**
```typescript
// ✓ Proper validation
import { validateFile } from '@/lib/storage/utils';

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate before upload
  const validation = validateFile(file);
  if (!validation.isValid) {
    setError(validation.error);
    return;
  }
  
  uploadFile(file, 'institutes');
};
```

### Step 3: Add Progress Tracking

```typescript
import { useFileUpload } from '@/hooks/useFileUpload';

const { uploadFile, isLoading, progress, error } = useFileUpload({
  onSuccess: (fileUrl) => {
    console.log('Upload complete:', fileUrl);
  },
  onError: (error) => {
    console.error('Upload failed:', error.message);
  },
});

// In JSX:
{isLoading && progress && (
  <div>
    <p>Uploading: {progress.percentage}%</p>
    <progress value={progress.percentage} max="100" />
  </div>
)}
```

## 📋 Common Components to Update

### 1. Institute Profile Form

**File:** `src/features/appInstitute/components/InstituteForm.tsx`

```typescript
// 1. Add imports
import { useFileUpload } from '@/hooks/useFileUpload';
import { validateFile } from '@/lib/storage/utils';

// 2. Add hook
const { uploadFile, isLoading: uploading } = useFileUpload({
  onSuccess: (url) => setForm(prev => ({ ...prev, logo: url }))
});

// 3. Update file handlers
const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !validateFile(file).isValid) return;
  
  try {
    await uploadFile(file, 'institutes');
  } catch (err) {
    // Error handling
  }
};

// 4. Update form data structure
// The form should now store fileUrl directly (from database)
// Example: institute.logo = "https://bucket.r2.dev/institutes/123/..."
```

### 2. Course Form

**File:** `src/features/course/components/CourseForm.tsx`

```typescript
// Same pattern as institute form
const { uploadFile } = useFileUpload({
  onSuccess: (url) => setForm(prev => ({ ...prev, banner: url }))
});

const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const validation = validateFile(file);
  if (!validation.isValid) {
    setError(validation.error);
    return;
  }
  
  try {
    await uploadFile(file, 'courses');
  } catch (err) {
    setError('Failed to upload banner');
  }
};
```

### 3. User Profile Form

**File:** `src/features/profile/components/ProfileForm.tsx`

```typescript
const { uploadFile } = useFileUpload({
  onSuccess: (url) => setForm(prev => ({ ...prev, profileImage: url }))
});

const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Delete old image (if any)
  if (form.profileImage) {
    await storageService.deleteFile({
      fileUrl: form.profileImage,
      folder: 'users'
    });
  }
  
  // Upload new image
  await uploadFile(file, 'users');
};
```

## 🗑️ Cleanup & Deletion

When users delete records, clean up files:

```typescript
import { storageService } from '@/lib/storage';

async function deleteInstitute(instituteId: string) {
  const institute = await fetchInstitute(instituteId);
  
  // Delete storage files
  if (institute.logo) {
    await storageService.deleteFile({
      fileUrl: institute.logo,
      folder: 'institutes'
    });
  }
  
  if (institute.banner) {
    await storageService.deleteFile({
      fileUrl: institute.banner,
      folder: 'institutes'
    });
  }
  
  // Delete from database
  await db.institute.delete({ where: { id: instituteId } });
}
```

## 🔄 Database Updates

No database schema changes needed! The system already stores URLs:

```prisma
model Institute {
  id        String @id @default(auto()) @map("_id") @db.ObjectId
  logo      String?  // Still just stores URL
  banner    String?  // Still just stores URL
  // ...
}
```

The difference:
- **Before**: URLs from external sources or manual uploads
- **After**: URLs from R2 (or any provider), managed via storageService

## ✅ Checklist for Each Component

- [ ] Import `useFileUpload` hook
- [ ] Import validation utilities
- [ ] Add hook to component
- [ ] Update file input handlers
- [ ] Add error handling UI
- [ ] Add loading state UI
- [ ] Add progress tracking (optional)
- [ ] Test upload with various file types
- [ ] Test error scenarios
- [ ] Test file deletion (if applicable)
- [ ] Update TypeScript types if needed

## 🧪 Testing

### Manual Testing

1. Upload image via UI → verify in Cloudflare R2 bucket
2. Check database stores correct URL
3. Verify image renders from URL
4. Test with invalid file types → should reject
5. Test with oversized file → should reject
6. Monitor browser network tab → direct upload to R2 (no server)

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from '@/hooks/useFileUpload';

describe('useFileUpload', () => {
  it('uploads file and returns URL', async () => {
    const { result } = renderHook(() => useFileUpload());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    await act(async () => {
      const url = await result.current.uploadFile(file, 'institutes');
      expect(url).toMatch(/^https:\/\//);
    });
  });

  it('validates file type', async () => {
    const { result } = renderHook(() => useFileUpload());
    const file = new File(['test'], 'test.exe', { type: 'application/octet-stream' });
    
    await act(async () => {
      await expect(result.current.uploadFile(file, 'institutes')).rejects.toThrow();
    });
  });
});
```

## 📦 Files Modified

- `src/features/appInstitute/...` (update institute form)
- `src/features/course/...` (update course form)
- `src/features/profile/...` (update profile form)
- `src/app/api/v1/institutes/...` (validate file URLs)
- `src/app/api/v1/courses/...` (validate file URLs)
- Any other forms with image/file uploads

## 🚀 Incremental Rollout

You don't need to update all forms at once:

1. Start with: Institute profile (most important)
2. Then: Course form
3. Then: User profile
4. Finally: Other minor forms

Each component can be updated independently.

## 💡 Tips

- Always validate files before upload
- Show progress indicators for better UX
- Handle errors gracefully
- Consider caching uploaded URLs temporarily
- Monitor R2 bucket size and costs
- Set up CDN if using custom domain
- Use image optimization services (Cloudflare Image Optimization)

## 🔗 Related Documentation

- [Storage System README](./src/lib/storage/README.md)
- [useFileUpload Hook](./src/hooks/useFileUpload.ts)
- [Storage Utilities](./src/lib/storage/utils.ts)
- [Upload API Endpoint](./src/app/api/v1/upload-url/route.ts)
