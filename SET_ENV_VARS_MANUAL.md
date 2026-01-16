# Manual Environment Variable Setup for Cloud Run

Since Cloud Build substitutions aren't expanding correctly in `--set-env-vars`, set these environment variables manually in the Cloud Run console.

## Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Run** → **digitalbusinesscardproduction**
3. Click **Edit & Deploy New Revision**
4. Go to **Variables & Secrets** tab
5. Add these environment variables:

```
VITE_SUPABASE_PROJECT_ID = tqpgffxiewfvrwkacqry
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcGdmZnhpZXdmdnJ3a2FjcXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTI1OTUsImV4cCI6MjA3OTUyODU5NX0.CL2-C0DIo0YezAi-DU369jZeLrhoKrFI73invDmzrQc
SUPABASE_PROJECT_ID = tqpgffxiewfvrwkacqry
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcGdmZnhpZXdmdnJ3a2FjcXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTI1OTUsImV4cCI6MjA3OTUyODU5NX0.CL2-C0DIo0YezAi-DU369jZeLrhoKrFI73invDmzrQc
```

6. Click **Deploy**

## Or use gcloud CLI:

```bash
gcloud run services update digitalbusinesscardproduction \
  --region us-central1 \
  --set-env-vars VITE_SUPABASE_PROJECT_ID=tqpgffxiewfvrwkacqry,VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcGdmZnhpZXdmdnJ3a2FjcXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTI1OTUsImV4cCI6MjA3OTUyODU5NX0.CL2-C0DIo0YezAi-DU369jZeLrhoKrFI73invDmzrQc,SUPABASE_PROJECT_ID=tqpgffxiewfvrwkacqry,SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcGdmZnhpZXdmdnJ3a2FjcXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTI1OTUsImV4cCI6MjA3OTUyODU5NX0.CL2-C0DIo0YezAi-DU369jZeLrhoKrFI73invDmzrQc
```

Once set, these will persist across all future deployments.
