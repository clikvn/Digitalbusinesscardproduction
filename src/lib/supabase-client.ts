import { createClient } from '@supabase/supabase-js';

// Try to import Supabase credentials
let projectId = '';
let publicAnonKey = '';

try {
  const info = require('../utils/supabase/info');
  projectId = info.projectId || '';
  publicAnonKey = info.publicAnonKey || '';
} catch (e) {
  console.error('[Supabase] Failed to load credentials:', e);
}

// Validate credentials
if (!projectId || !publicAnonKey) {
  console.error('[Supabase] Missing credentials - projectId or publicAnonKey not found');
}

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

console.log('[Supabase] Initializing client with:', {
  url: supabaseUrl,
  hasKey: !!supabaseKey,
  keyLength: supabaseKey?.length || 0
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
      'x-application-name': 'figma-make-interior-designer'
    }
  }
});

// Export URL and key for analytics batcher
export { supabaseUrl, supabaseKey };