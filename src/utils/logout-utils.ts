/**
 * Utility functions for handling logout and clearing session data
 */

/**
 * Clears all Supabase session storage from localStorage and sessionStorage
 */
export function clearSupabaseSessionStorage() {
  // Clear all Supabase session storage from localStorage
  const supabaseStorageKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-') || key.startsWith('supabase.auth'))) {
      supabaseStorageKeys.push(key);
    }
  }
  supabaseStorageKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear all Supabase session storage from sessionStorage
  const supabaseSessionKeys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-') || key.startsWith('supabase.auth'))) {
      supabaseSessionKeys.push(key);
    }
  }
  supabaseSessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });
}
