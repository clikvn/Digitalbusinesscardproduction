# Google Cloud Run Deployment Guide

This guide explains how to deploy the Digital Business Card Production platform to Google Cloud Run.

## Prerequisites

1. Google Cloud Project with billing enabled
2. Google Cloud SDK (`gcloud`) installed and configured
3. Docker installed (for local testing)
4. GitHub repository connected to Google Cloud Build (optional, for CI/CD)

## Environment Variables

The application requires the following environment variables:

- `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Setting Environment Variables in Cloud Run

1. **Via Cloud Console:**
   - Go to Cloud Run → Your Service → Edit & Deploy New Revision
   - Under "Variables & Secrets", add:
     - `VITE_SUPABASE_PROJECT_ID` = `your-project-id`
     - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

2. **Via gcloud CLI:**
   ```bash
   gcloud run services update digital-business-card \
     --set-env-vars VITE_SUPABASE_PROJECT_ID=your-project-id,VITE_SUPABASE_ANON_KEY=your-anon-key \
     --region us-central1
   ```

3. **Via cloudbuild.yaml:**
   - Update the `_VITE_SUPABASE_PROJECT_ID` and `_VITE_SUPABASE_ANON_KEY` substitutions in `cloudbuild.yaml`

## Deployment Methods

### Method 1: Using Cloud Build (Recommended for CI/CD)

1. **Connect GitHub repository to Cloud Build:**
   - Go to Cloud Build → Triggers
   - Create a new trigger connected to your GitHub repository
   - Set build configuration to use `cloudbuild.yaml`

2. **Manual build with Cloud Build:**
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

### Method 2: Manual Docker Build & Deploy

1. **Build the Docker image with build arguments:**
   ```bash
   docker build \
     --build-arg VITE_SUPABASE_PROJECT_ID=your-project-id \
     --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
     -t gcr.io/YOUR_PROJECT_ID/digital-business-card .
   ```

2. **Push to Container Registry:**
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/digital-business-card
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy digital-business-card \
     --image gcr.io/YOUR_PROJECT_ID/digital-business-card \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8080
   ```

### Method 3: Direct Deploy from Source

**Note:** Direct deploy from source may not pass build arguments correctly. Use Method 1 or 2 for reliable builds.

```bash
gcloud run deploy digital-business-card \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

## Local Testing

Before deploying, test the Docker image locally:

```bash
# Build
npm run docker:build

# Run
npm run docker:run

# Or directly with docker
docker build -t digital-business-card .
docker run -p 8080:8080 \
  -e VITE_SUPABASE_PROJECT_ID=your-project-id \
  -e VITE_SUPABASE_ANON_KEY=your-anon-key \
  digital-business-card
```

Visit `http://localhost:8080` to verify it works.

## Build Configuration

### Dockerfile
- Uses multi-stage build (Node.js for building, nginx for serving)
- Builds the Vite app and serves static files with nginx
- Exposes port 8080 (Cloud Run default)

### nginx.conf
- Configured for SPA routing (all routes serve index.html)
- Gzip compression enabled
- Security headers included
- Static asset caching (1 year)

## Custom Domain (Optional)

1. Map a custom domain in Cloud Run
2. Update DNS records as instructed
3. SSL certificate is automatically provisioned

## Monitoring

- View logs: `gcloud run services logs read digital-business-card --region us-central1`
- View metrics in Cloud Console → Cloud Run → Your Service

## Troubleshooting

### Build fails
- Check that all dependencies are in `package.json`
- Verify Dockerfile syntax
- Check build logs in Cloud Build

### App doesn't load
- Verify environment variables are set correctly
- Check nginx logs: `gcloud run services logs read digital-business-card`
- Ensure port 8080 is exposed

### Environment variables not working
- **Critical:** Vite requires environment variables at **build time**, not runtime
- Pass env vars as `--build-arg` when building Docker image
- Rebuild the Docker image after changing env vars (they're baked into the build)
- For runtime env vars, use a server-side approach (not applicable for static SPA)

## Notes

- **Critical:** The app is built as a static SPA, so environment variables must be set at **build time** (not runtime)
- Environment variables are passed as Docker build arguments (`--build-arg`)
- Vite bakes env vars into the JavaScript bundle during build
- For runtime configuration changes, you'll need to rebuild and redeploy
- The `info.tsx` file is used as a fallback for local development only

