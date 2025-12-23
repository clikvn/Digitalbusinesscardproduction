import { createClient } from '@supabase/supabase-js';
import * as info from '../utils/supabase/info';

// Get Supabase credentials from environment variables (preferred for Cloud Run)
// Fallback to info file for local development
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || info.projectId || '';
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || info.publicAnonKey || '';

// Validate credentials
if (!projectId || !publicAnonKey) {
  console.error('[Supabase] Missing credentials - projectId or publicAnonKey not found');
  console.error('[Supabase] Set VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY environment variables');
  console.error('[Supabase] For local development, using fallback from src/utils/supabase/info.tsx');
}

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

console.log('[Supabase] Initializing client with:', {
  url: supabaseUrl,
  hasKey: !!supabaseKey,
  keyLength: supabaseKey?.length || 0,
  source: import.meta.env.VITE_SUPABASE_PROJECT_ID ? 'environment' : 'fallback'
});

// Note about Edge Functions
console.log(
  '%c[Supabase] Edge Functions Disabled',
  'background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px;',
  '\n  ✓ This is intentional - we use direct client calls with RLS\n  ✓ If you see "403 deployment error", it\'s safe to ignore\n  ✓ The app works perfectly without Edge Functions'
);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'digital-business-card-production'
    }
  }
});

// Export URL and key for analytics batcher
export { supabaseUrl, supabaseKey };
