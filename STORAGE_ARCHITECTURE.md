# Storage Abstraction Layer - Complete Architecture

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ React Component                                     │  │
│  │ ├─ useFileUpload hook                              │  │
│  │ ├─ File validation                                 │  │
│  │ └─ Progress tracking                               │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                      │            │
│         │ (1) GET /api/v1/upload-url        │            │
│         │ + fileType, folder, size          │            │
│         │                                    │            │
└─────────┼────────────────────────────────────┼────────────┘
          │                                     │
┌─────────▼────────────────────────────────────▼────────────┐
│              Node.js Server (Next.js)                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ POST /api/v1/upload-url                            │ │
│  │ ├─ Validate authentication                       │ │
│  │ ├─ Validate file type & size                     │ │
│  │ ├─ Check user permissions                        │ │
│  │ └─ Call storageService.getUploadUrl()            │ │
│  └──────────────────────────────────────────────────────┘ │
│         │                                       │          │
│         │                                       │          │
│         ▼                                       ▼          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  storageService (Provider Agnostic)                │ │
│  │  - Determines active provider via ENV             │ │
│  │  - Routes to correct provider                     │ │
│  │  - Logs operations                                │ │
│  └──────────────────────────────────────────────────────┘ │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Storage Provider (Pluggable Interface)            │ │
│  │  ├─ R2Provider (current)                          │ │
│  │  │  └─ Generates AWS Sig v4 pre-signed URL      │ │
│  │  ├─ S3Provider (future)                          │ │
│  │  └─ CloudinaryProvider (future)                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                        │                                   │
│  Returns: { uploadUrl, fileUrl, expiresAt }              │
└─────────┬────────────────────────────────────────────────┘
          │
          │ (2) Response with URLs
          │
┌─────────▼────────────────────────────────────────────────┐
│              Browser (Client) - Step 2                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ fetch(uploadUrl, {                                │ │
│  │   method: 'PUT',                                 │ │
│  │   body: file,                                   │ │
│  │   headers: { 'Content-Type': ... }            │ │
│  │ })                                              │ │
│  │                                                │ │
│  │ ✓ File uploaded directly to storage           │ │
│  │ ✓ NO data passes through server               │ │
│  │ ✓ Server bandwidth saved                       │ │
│  └──────────────────────────────────────────────────────┘ │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────┐
│  Cloudflare R2 (Object Storage)                            │
│  ├─ S3-compatible API                                      │
│  ├─ Stores file at returned location                       │
│  └─ File immediately accessible via public URL             │
└────────────────────────────────────────────────────────────┘
          │
          │ fileUrl = https://bucket.r2.dev/institutes/.../file
          │
┌─────────▼────────────────────────────────────────────────────┐
│  Database (MongoDB)                                         │
│  ├─ institute.logo = fileUrl                             │
│  ├─ institute.banner = fileUrl                           │
│  └─ Only URL stored, not file data                       │
└────────────────────────────────────────────────────────────┘
```

## 🔄 Upload Data Flow

### Phase 1: Get Upload Credentials

```
Client                          Server                      R2
  │                               │                         │
  ├──(1) POST /api/v1/upload-url->│                         │
  │      + file metadata          │                         │
  │                               ├─ Validate auth         │
  │                               ├─ Validate file type    │
  │                               ├─ Check permissions     │
  │                               │                        │
  │                               ├─ Generate sig URL─────>│
  │                               │   (valid 1 hour)       │
  │                               │                        │
  │<─────(2) response: uploadUrl─-│                        │
  │         + fileUrl                                      │
  │         + expiresAt                                    │
```

### Phase 2: Direct Upload

```
Client                          Server                      R2
  │                                │                       │
  ├─(3) PUT file to uploadUrl ────────────────────────────>│
  │     (no server involved)       │                       │
  │     Headers: Content-Type      │                       │
  │     Body: file data            │                       │
  │                                │                       │
  │<───────(4) 200 OK ─────────────────────────────────────│
  │     File stored at R2          │                       │
  │     Public URL available       │                       │
```

### Phase 3: Database Update

```
Client                          Server                      DB
  │                               │                        │
  ├─(5) POST /api/.../institute→ │                        │
  │      + logo: fileUrl          │                        │
  │                               ├─ Update record─────────>│
  │                               │< Confirm          │
  │<───────(6) 200 OK ────────────│                        │
  │     Update complete           │                        │
```

## 💾 Data Model

### Storage Folder Structure

```
R2 Bucket: classes360/
├── institutes/
│   ├── {instituteId}/
│   │   ├── 1704067200000-abc123def456-logo.jpg
│   │   ├── 1704067300000-def456ghi789-banner.png
│   │   └── 1704067400000-ghi789jkl012-favicon.ico
│
├── users/
│   ├── {userId}/
│   │   └── 1704067500000-jkl012mno345-profile.jpg
│
├── courses/
│   ├── {courseId}/
│   │   └── 1704067600000-mno345pqr678-banner.png
│
└── documents/
    ├── {docId}/
    │   └── 1704067700000-pqr678stu901-notes.pdf
```

### Database Schema (Prisma)

```prisma
model Institute {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  name         String
  
  // Image URLs only - no file storage!
  logo         String?  @db.String // https://bucket.r2.dev/institutes/.../logo.jpg
  banner       String?  @db.String // https://bucket.r2.dev/institutes/.../banner.png
  heroImage    String?  @db.String // https://bucket.r2.dev/institutes/.../hero.jpg
  faviconUrl   String?  @db.String // https://bucket.r2.dev/institutes/.../favicon.ico
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Course {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  banner       String?  @db.String // https://bucket.r2.dev/courses/.../banner.png
  // ... other fields
}

model User {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  email        String   @unique
  // Note: User profile image could be added
  // profileImage String?
}
```

## 🔐 Security Model

### Authentication & Authorization

```typescript
// 1. Request must have valid session
POST /api/v1/upload-url {
  Authorization: Bearer {sessionToken}  // ✓ Required
}
↓
const session = await getSession();
if (!session?.user?.id) return 401 Unauthorized;

// 2. User can only upload to their owned entity
{
  folder: 'institutes',
  fileType: 'image/jpeg'
}
↓
// Verify user owns this institute
if (!session.user.instituteId) return 403 Forbidden;

// 3. File type whitelist
ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
if (!ALLOWED_TYPES.includes(fileType)) return 400 Bad Request;

// 4. File size limits
MAX_SIZES = { 'image/jpeg': 2MB, 'application/pdf': 10MB }
if (fileSize > MAX_SIZES[fileType]) return 400 Bad Request;
```

### URL Expiration & Scoping

```typescript
// Pre-signed URLs are:
// 1. Time-limited (1 hour)
// 2. HTTP method-specific (PUT only for upload)
// 3. Content-type specific
// 4. Path-specific (can't access other files)

"X-Amz-Expires=3600"  // Expires in 1 hour
"X-Amz-SignedHeaders=host"  // Can't modify headers
```

### Rate Limiting (Future)

```typescript
// Per-user rate limits
const LIMITS = {
  10: '1 request per 10 minutes',  // Free tier
  50: '5 requests per minute',     // Pro tier
};

// Tracked by:
// - User ID
// - Folder (institutes, users, documents)
// - Time window
```

## 🌍 Environment Configuration

### Recommended Settings

**Development:**
```env
STORAGE_PROVIDER=r2
# R2 credentials (test bucket)
CLOUDFLARE_BUCKET_NAME=classes360-dev
```

**Production:**
```env
STORAGE_PROVIDER=r2
# R2 credentials (prod bucket)
CLOUDFLARE_BUCKET_NAME=classes360-prod
# CDN enabled
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.classes360.com/assets
```

**Staging:**
```env
STORAGE_PROVIDER=r2
CLOUDFLARE_BUCKET_NAME=classes360-staging
```

### Custom Domain (Optional)

```
1. Configure R2 custom domain in Cloudflare
2. Point CNAME to R2 endpoint
3. Set CLOUDFLARE_R2_PUBLIC_URL to custom domain
4. Enable Cloudflare Image Optimization on domain
5. All URLs use custom domain automatically
```

## 📊 Performance Characteristics

### Benefits

| Aspect | Benefit |
|--------|---------|
| **Server Bandwidth** | Files bypass server, saved ~100% |
| **Upload Speed** | Direct to CDN, optimal routing |
| **Scalability** | Unlimited concurrent uploads |
| **Cost** | R2 cheaper than server storage |
| **Redundancy** | Multiple R2 regions available |
| **CDN** | Cloudflare automatic caching |
| **Optimization** | Cloudflare image optimization |

### Costs (Cloudflare R2)

- **Storage**: $0.015/GB/month
- **API Requests**: $0.36/million requests
- **Data Transfer Out**: $0.20/GB (to internet)
- **Data Transfer In**: Free

## 🔄 Provider Switching

### Adding a New Provider

1. **Create provider file:**
   ```typescript
   // src/lib/storage/providers/newProvider.ts
   export const newProvider: StorageProvider = {
     async getUploadUrl(params) { /* ... */ },
     async deleteFile(params) { /* ... */ },
     async verify() { /* ... */ },
   };
   ```

2. **Update storageService:**
   ```typescript
   // src/lib/storage/storageService.ts
   case 'newprovider':
     return newProvider;
   ```

3. **Set environment variable:**
   ```env
   STORAGE_PROVIDER=newprovider
   ```

4. **Done!** No component changes needed.

## 📈 Monitoring & Logging

### What to Monitor

```typescript
// Log all uploads
console.log(`Upload: ${folder}/${entityId} (${fileSize} bytes)`);

// Monitor errors
console.error(`Upload failed: ${error.message}`);

// Track performance
const duration = Date.now() - startTime;
console.log(`Upload completed in ${duration}ms`);

// Monitor costs
const monthlyTransfer = uploadCount * avgFileSize;
console.log(`Estimated monthly transfer: ${monthlyTransfer}GB`);
```

### Suggested Metrics

- Total uploads per day/month
- Average file size
- Upload error rate
- Upload duration (p50, p95, p99)
- Storage usage growth
- Estimated monthly costs
- Failed deletions
- Expired URLs

## 🚀 Deployment Checklist

- [ ] Set `STORAGE_PROVIDER` environment variable
- [ ] Add Cloudflare R2 credentials
- [ ] Create R2 bucket
- [ ] Set bucket public access policy
- [ ] Configure custom domain (optional)
- [ ] Enable Cloudflare Image Optimization
- [ ] Set up CORS if needed
- [ ] Test upload flow in staging
- [ ] Monitor for errors in production
- [ ] Set up alerts for storage quota
- [ ] Document R2 access for team
- [ ] Plan disaster recovery (backup strategy)

## 📚 Related Files

- [Storage Service](src/lib/storage/storageService.ts)
- [Storage Types](src/lib/storage/types.ts)
- [R2 Provider](src/lib/storage/providers/r2Provider.ts)
- [Upload API](src/app/api/v1/upload-url/route.ts)
- [React Hook](src/hooks/useFileUpload.ts)
- [Storage Utilities](src/lib/storage/utils.ts)
- [Migration Guide](STORAGE_MIGRATION.md)
- [System README](src/lib/storage/README.md)
