# Storage System - Quick Reference & Troubleshooting

## 📖 Quick Start

### For Users/Admins
1. Get Cloudflare R2 credentials
2. Set environment variables in `.env`
3. Upload files via UI (automatic, no config needed)
4. Verify files appear in Cloudflare dashboard

### For Developers
1. Install nothing (no npm packages needed!)
2. Import `useFileUpload` in components
3. Use hook to handle uploads
4. Test in browser dev tools

### For DevOps
1. Add R2 credentials to deployment
2. Set `STORAGE_PROVIDER=r2` ENV variable
3. Monitor R2 bucket size and costs
4. Set up CloudFlare Auto-purge if needed

## 🎯 Common Tasks

### Task 1: Add Image Upload to New Form

```typescript
import { useFileUpload } from '@/hooks/useFileUpload';
import { validateFile } from '@/lib/storage/utils';

export function MyForm() {
  const { uploadFile, isLoading, error } = useFileUpload({
    onSuccess: (url) => console.log('Uploaded:', url)
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!validateFile(file).isValid) {
      alert('Invalid file');
      return;
    }
    
    await uploadFile(file, 'institutes');
  };

  return (
    <input type="file" onChange={handleFileChange} disabled={isLoading} />
  );
}
```

### Task 2: Delete Old File When Uploading New One

```typescript
import { storageService } from '@/lib/storage';

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Delete old
  if (currentLogoUrl) {
    await storageService.deleteFile({
      fileUrl: currentLogoUrl,
      folder: 'institutes'
    });
  }

  // Upload new
  const newUrl = await uploadFile(file, 'institutes');
  setLogo(newUrl);
};
```

### Task 3: Switch to Different Storage Provider

```
Old: STORAGE_PROVIDER=r2
     ↓
New: STORAGE_PROVIDER=s3
     
No code changes needed! ✓
Re-deploy, that's it.
```

### Task 4: Monitor Upload Errors

```typescript
import { useFileUpload } from '@/hooks/useFileUpload';

export function Form() {
  const { uploadFile, error } = useFileUpload({
    onError: (err) => {
      console.error('Upload failed:', err.message);
      // Send to error tracking (Sentry, etc)
      trackError('storage_upload_failed', {
        message: err.message,
        timestamp: new Date()
      });
    }
  });

  // ...rest of component
}
```

## ❓ FAQ

### Q: Can I use local file paths instead of URLs?
**A:** No, system is designed for URLs only. Benefits:
- Scalable across servers
- Easy to move/migrate
- Can use any storage provider
- Easy to add CDN

### Q: Will my database grow too large?
**A:** No. Only URLs stored (~200 bytes each).
- Database: URLs only
- Files: External (R2)
- Bandwidth: Optimized

### Q: Can users upload directly without going through server?
**A:** Yes! That's the design.
- Browser → R2 (direct)
- Server only generates credentials
- No file data on server

### Q: What if upload fails?
**A:** Files never reach database.
Default retry in hook:
```typescript
{error && (
  <button onClick={() => uploadFile(file, folder)}>
    Retry
  </button>
)}
```

### Q: Can I preview files before upload?
**A:** Yes, use FileReader:
```typescript
const preview = await fileToDataUrl(file);
// Use in img element for preview
```

### Q: How do I handle large files?
**A:** Set `MAX_FILE_SIZES` in `utils.ts`:
```typescript
export const MAX_FILE_SIZES: Record<UploadFileType, number> = {
  'image/jpeg': 5 * 1024 * 1024, // Increase if needed
};
```

### Q: Can I compress/resize images?
**A:** Not built-in, but options:
1. **Cloudflare Image Optimization** (recommended)
2. Browser-side: Use `sharp-wasm` 
3. Server-side: Process after upload

### Q: What about GDPR/privacy?
**A:** System supports:
- File deletion on request
- HTTPS encryption (R2 default)
- Access logs (R2 S3 API Logs)
- CORS restriction (set in R2)

## 🐛 Troubleshooting

### **Issue: 401 Unauthorized on upload**

**Cause:** No session/auth
```typescript
// Check:
const session = await getSession();
console.log(session); // Should have user data

// Solutions:
1. Login to app
2. Check cookies are set
3. Check NEXTAUTH config
```

### **Issue: 400 Bad Request - File type not allowed**

**Cause:** MIME type not in whitelist
```typescript
// Check file type
console.log(file.type); // Not in SUPPORTED_FILE_TYPES?

// Solutions:
1. Use JPEG/PNG/WebP for images
2. Use PDF for documents
3. Update MAX_FILE_SIZES if needed
```

### **Issue: 400 Bad Request - File too large**

**Cause:** File exceeds size limit
```typescript
// The limit is:
MAX_FILE_SIZES['image/jpeg'] // 2MB

// Solutions:
1. Compress image before upload
2. Increase limit in utils.ts
3. Split large files (PDFs)
```

### **Issue: File uploaded but URL not saving to DB**

**Cause:** Either upload didn't complete or DB save failed
```typescript
// Check:
1. Did R2 bucket receive the file?
   → Check Cloudflare dashboard
2. Is fileUrl valid?
   → Check console.log(fileUrl)
3. Is database update failing?
   → Check network tab for 500 errors
```

### **Issue: Can access file URL directly but not in app**

**Cause:** File exists but displays broken
```typescript
// Check:
1. Image component error boundary
   → <Image onError={...} />
2. CORS headers (if cross-origin)
   → This R2 should have CORS enabled
3. URL format
   → https://bucket.r2.dev/path (correct)
   → http://bucket... (wrong - use HTTPS)
```

### **Issue: Upload very slow**

**Cause:** R2 bucket location or network
```typescript
// Check:
1. R2 bucket region
   → Use closest region to users
2. Cloudflare zone plan
   → Upgrade if needed
3. File size
   → Compress before upload
4. Network condition
   → Check browser throttle
```

### **Issue: Environment variables not loaded**

**Cause:** .env not configured or wrong format
```
# Check format:
CLOUDFLARE_ACCOUNT_ID=abc123  # ✓ Correct
CLOUDFLARE_ACCOUNT_ID =abc123 # ✗ Wrong (spaces)
CLOUDFLARE_ACCOUNT_ID=         # ✗ Empty

# Verify:
console.log(process.env.CLOUDFLARE_ACCOUNT_ID);
// Should print value, not undefined
```

### **Issue: "Missing required Cloudflare R2 configuration"**

**Cause:** One or more R2 ENV variables missing
```typescript
// Required ENV vars:
CLOUDFLARE_ACCOUNT_ID       ✓
CLOUDFLARE_ACCESS_KEY_ID    ✓
CLOUDFLARE_ACCESS_KEY_SECRET ✓
CLOUDFLARE_BUCKET_NAME       ✓
CLOUDFLARE_R2_PUBLIC_URL     (optional - calculated if missing)

// Check:
1. All in .env file?
2. Not in .env.local?
3. Deployed with correct secrets?
```

## 📞 Support

### Resources
- [Storage README](src/lib/storage/README.md)
- [Architecture Docs](STORAGE_ARCHITECTURE.md)
- [Migration Guide](STORAGE_MIGRATION.md)

### How to Debug

```typescript
// 1. Enable verbose logging
const { uploadFile } = useFileUpload({
  onSuccess: (url) => console.log('✓ Upload successful:', url),
  onError: (err) => console.error('✗ Upload failed:', err),
});

// 2. Check browser DevTools
// - Network tab: Should see PUT to R2 URL
// - Console: Check for errors
// - Application > Storage: Check cookies

// 3. Check production logs
// - Vercel/deployment logs
// - Cloudflare R2 API logs
// - Application error tracking (Sentry)

// 4. Verify R2 config
// - Login to Cloudflare dashboard
// - Check bucket exists
// - Check API token has R2 permissions
// - Check bucket is not locked
```

## ✅ Health Check

Verify system is working:

```bash
# 1. Check environment variables
echo $CLOUDFLARE_ACCOUNT_ID  # Should print ID

# 2. Test Upload API
curl -X POST http://localhost:3000/api/v1/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "image/jpeg",
    "folder": "institutes",
    "fileName": "test.jpg",
    "fileSize": 1000000
  }'

# Should return: { uploadUrl, fileUrl, expiresAt }

# 3. Test R2 Connection
# (From Cloudflare dashboard: R2 > API Tokens > Test)
# Should authenticate successfully

# 4. Verify bucket permissions
# (From R2 bucket settings)
# Should allow PUT from signed URLs
```

## 📚 Next Steps

- [ ] Implement first form with uploads
- [ ] Test upload flow end-to-end
- [ ] Monitor R2 costs
- [ ] Add progress UI
- [ ] Implement file deletion
- [ ] Set up error tracking
- [ ] Document for team
- [ ] Plan backup strategy
