# Quick Start: Google Cloud Run Setup

## ✅ What's Been Configured

1. **Dockerfile** - Multi-stage build (Node.js → nginx)
2. **nginx.conf** - SPA routing, compression, security headers
3. **.dockerignore** - Optimized build context
4. **cloudbuild.yaml** - CI/CD configuration
5. **Environment Variables** - Supabase credentials support

## 🚀 Quick Deploy

### Option 1: Direct Deploy (Easiest)

**Note:** Direct deploy may not pass build arguments correctly. For reliable builds, use Option 2 or Cloud Build.

```bash
gcloud run deploy digital-business-card \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

### Option 2: Docker Build & Deploy

```bash
# Build with build arguments (required for Vite env vars)
docker build \
  --build-arg VITE_SUPABASE_PROJECT_ID=tqpgffxiewfvrwkacqry \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcGdmZnhpZXdmdnJ3a2FjcXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTI1OTUsImV4cCI6MjA3OTUyODU5NX0.CL2-C0DIo0YezAi-DU369jZeLrhoKrFI73invDmzrQc \
  -t gcr.io/YOUR_PROJECT_ID/digital-business-card .

# Push
docker push gcr.io/YOUR_PROJECT_ID/digital-business-card

# Deploy (no env vars needed - they're baked into the build)
gcloud run deploy digital-business-card \
  --image gcr.io/YOUR_PROJECT_ID/digital-business-card \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

## 📝 Important Notes

1. **Environment Variables**: Must be set at build time (Vite requirement)
   - Pass as `--build-arg` when building Docker image
   - Vite bakes env vars into the JavaScript bundle during build
   - The `info.tsx` file is only used as fallback for local development

2. **Port**: Cloud Run uses port 8080 (configured in Dockerfile and nginx.conf)

3. **Build Output**: Vite builds to `build/` directory (configured in vite.config.ts)

4. **Figma Make Compatibility**: 
   - Asset aliases are maintained in vite.config.ts for backward compatibility
   - Existing `figma:asset/...` imports will continue to work
   - New code should use `@assets/...` or relative paths

## 🔧 Testing Locally

```bash
# Build Docker image
npm run docker:build

# Run locally
npm run docker:run

# Build with custom env vars first, then run
docker build \
  --build-arg VITE_SUPABASE_PROJECT_ID=your-id \
  --build-arg VITE_SUPABASE_ANON_KEY=your-key \
  -t digital-business-card .

docker run -p 8080:8080 digital-business-card
```

Visit `http://localhost:8080` to test.

## 📚 Full Documentation

See `DEPLOYMENT.md` for comprehensive deployment guide.

