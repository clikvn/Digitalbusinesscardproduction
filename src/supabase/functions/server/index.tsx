/**
 * DEPRECATED - Edge Functions Removed
 * 
 * ⚠️ This file is NO LONGER USED and should NOT be deployed.
 * 
 * We refactored to remove Edge Functions due to persistent 403 deployment errors.
 * All functionality now uses direct Supabase client calls with RLS policies.
 * 
 * DO NOT DEPLOY THIS FILE.
 * 
 * Original functionality (now handled elsewhere):
 * - Signup: Handled by Supabase Auth + database triggers
 * - Upload: Handled by Supabase Storage with RLS policies
 * 
 * See /lib/api.ts for current implementation.
 */

// This file is kept only to prevent breaking changes.
// It should be disabled in deployment configuration.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Hono } from 'jsr:@hono/hono@4';

const app = new Hono();

// ============================================
// SUPABASE CLIENT HELPERS
// ============================================

function getSupabaseClient(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );
}

function getAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

/**
 * Verify user owns a specific user code
 */
async function verifyOwnership(userCode: string, userId: string): Promise<boolean> {
  const supabaseAdmin = getAdminClient();
  const { data } = await supabaseAdmin
    .from('user_code_ownership')
    .select('user_id')
    .eq('user_code', userCode)
    .single();
  
  return data?.user_id === userId;
}

// ============================================
// HEALTH CHECK
// ============================================

app.get("/make-server-47604332/health", (c) => {
  return c.json({ status: "ok", message: "Server proxy is active" });
});

// ============================================
// AUTH ROUTES
// ============================================

/**
 * Sign Up - Creates user with auto-confirmation
 * The database trigger will automatically create user code and business card
 * POST /make-server-47604332/signup
 * Body: { email, password, name }
 */
app.post("/make-server-47604332/signup", async (c) => {
  const body = await c.req.json();
  const { email, password, name } = body;
  
  const supabaseAdmin = getAdminClient();
  
  // Create the auth user - the trigger will handle the rest
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
    email_confirm: true
  });
  
  if (error) {
    console.error("Supabase Create User Error:", error);
    return c.json({ error: error.message || "Failed to create user" }, 400);
  }
  
  const userId = data.user.id;
  
  // Wait a moment for the trigger to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Fetch the user code that was created by the trigger
  const { data: ownershipData, error: ownershipError } = await supabaseAdmin
    .from('user_code_ownership')
    .select('user_code')
    .eq('user_id', userId)
    .single();
  
  if (ownershipError || !ownershipData) {
    console.error("Failed to fetch user code after signup:", ownershipError);
    // Return success but without user code - they can still log in
    return c.json({ 
      user: data.user,
      userCode: null,
      warning: "Account created but user code not found. Please contact support."
    });
  }
  
  return c.json({ 
    user: data.user,
    userCode: ownershipData.user_code
  });
});

// ============================================
// STORAGE ROUTES
// ============================================

/**
 * Upload File - Requires authentication and ownership verification
 * POST /make-server-47604332/upload
 * Body: FormData with 'file' and 'userCode'
 */
app.post("/make-server-47604332/upload", async (c) => {
  const supabase = getSupabaseClient(c.req.raw);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const formData = await c.req.parseBody();
  const file = formData['file'];
  const userCode = formData['userCode'];

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  if (!userCode || typeof userCode !== 'string') {
    return c.json({ error: 'Missing userCode' }, 400);
  }

  const isOwner = await verifyOwnership(userCode, user.id);
  if (!isOwner) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userCode}/${timestamp}-${crypto.randomUUID()}.${fileExt}`;

  // Use Admin client to upload
  const supabaseAdmin = getAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('user-assets')
    .upload(fileName, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return c.json({ error: `Failed to upload: ${uploadError.message}` }, 500);
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('user-assets')
    .getPublicUrl(fileName);

  return c.json({ url: publicUrl });
});

// ============================================
// SERVE
// ============================================

Deno.serve(app.fetch);