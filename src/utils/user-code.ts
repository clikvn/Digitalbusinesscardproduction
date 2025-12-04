import { ContactGroup } from '../types/contacts';

const USER_CODE_KEY = 'user_code';
const DEFAULT_USER_CODE = 'myclik'; // Default user set by system admin

// Group code mapping for shorter URLs
export const GROUP_CODES: Record<ContactGroup, string> = {
  'public': 'pub',
  'private': 'prv',
  'business': 'biz',
  'personal': 'per',
};

// Reverse mapping for decoding
export const CODE_TO_GROUP: Record<string, ContactGroup> = {
  'pub': 'public',
  'prv': 'private',
  'biz': 'business',
  'per': 'personal',
};

/**
 * Generate a random user code
 */
function generateRandomCode(length: number = 8): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Get or create user code
 */
export function getUserCode(): string {
  try {
    let code = localStorage.getItem(USER_CODE_KEY);
    if (!code) {
      code = generateRandomCode();
      localStorage.setItem(USER_CODE_KEY, code);
    }
    return code;
  } catch (error) {
    console.error('Error getting user code:', error);
    return generateRandomCode();
  }
}

/**
 * Set a custom user code
 */
export function setUserCode(code: string): void {
  try {
    localStorage.setItem(USER_CODE_KEY, code);
  } catch (error) {
    console.error('Error setting user code:', error);
  }
}

/**
 * Generate share URL for a specific group
 */
export function generateShareUrl(group: ContactGroup): string {
  const userCode = getUserCode();
  const groupCode = GROUP_CODES[group];
  return `${window.location.origin}/${userCode}/${groupCode}`;
}

/**
 * Generate share URL using custom group share code
 */
export function generateShareUrlWithCode(userCode: string, shareCode: string): string {
  return `${window.location.origin}/${userCode}/${shareCode}`;
}

/**
 * Generate public profile URL (no group restriction)
 */
export function generatePublicProfileUrl(): string {
  const userCode = getUserCode();
  return `${window.location.origin}/${userCode}`;
}

/**
 * Parse URL path to extract user code and group code
 */
export function parseProfileUrl(pathname?: string): {
  userCode: string | null;
  group: string | null; // Can be legacy short code (pub, prv) OR custom share code (6 chars)
  screen: 'home' | 'contact' | 'profile' | 'portfolio' | null;
  isCMS: boolean; // Whether this is a CMS route
  cmsSection: string | null; // CMS section if on a CMS route
} {
  // Default to current pathname if not provided
  const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
  
  // Remove leading slash and split
  const parts = path.replace(/^\//, '').split('/').filter(p => p);
  
  // Handle root path - return default user
  if (parts.length === 0 || !parts[0]) {
    return { userCode: DEFAULT_USER_CODE, group: null, screen: null, isCMS: false, cmsSection: null };
  }
  
  // First part is always userCode
  const userCode = parts[0];
  
  // Second part could be groupCode, screen, or 'studio' (CMS indicator)
  const secondPart = parts[1];
  
  // Check if this is a CMS route
  if (secondPart === 'studio') {
    const cmsSection = parts[2] || null; // Third part is the CMS section
    return { userCode, group: null, screen: null, isCMS: true, cmsSection };
  }
  
  // Third part would be screen if we have a groupCode
  const thirdPart = parts[2];
  
  // Check if second part is a valid legacy group code
  const isLegacyGroupCode = secondPart && CODE_TO_GROUP[secondPart];
  
  // Check if second part looks like a screen name
  const isScreenName = secondPart === 'contact' || secondPart === 'profile' || secondPart === 'portfolio';
  
  let group: string | null = null;
  let screen: 'home' | 'contact' | 'profile' | 'portfolio' | null = null;
  
  if (isLegacyGroupCode) {
    // Legacy short code like 'pub', 'prv'
    group = CODE_TO_GROUP[secondPart];
    // Screen would be in third position
    if (thirdPart === 'contact' || thirdPart === 'profile' || thirdPart === 'portfolio') {
      screen = thirdPart;
    }
  } else if (secondPart && !isScreenName) {
    // Assume it's a custom share code (6+ characters, alphanumeric)
    group = secondPart;
    // Screen would be in third position
    if (thirdPart === 'contact' || thirdPart === 'profile' || thirdPart === 'portfolio') {
      screen = thirdPart;
    }
  } else if (isScreenName) {
    // Second part is a screen name, no group specified
    screen = secondPart;
  }
  
  return { userCode, group, screen, isCMS: false, cmsSection: null };
}

/**
 * Build a profile URL with optional group and screen
 */
export function buildProfileUrl(options: {
  userCode?: string;
  group?: ContactGroup | null;
  screen?: 'home' | 'contact' | 'profile' | 'portfolio' | null;
}): string {
  const { userCode = getUserCode(), group = null, screen = null } = options;
  
  let path = `/${userCode}`;
  
  if (group) {
    const groupCode = GROUP_CODES[group];
    path += `/${groupCode}`;
  }
  
  if (screen && screen !== 'home') {
    path += `/${screen}`;
  }
  
  return path;
}

/**
 * Build a CMS URL for a specific user
 */
export function buildCMSUrl(userCode?: string, section?: string): string {
  const code = userCode || getUserCode();
  let path = `/${code}/studio`;
  
  if (section) {
    path += `/${section}`;
  }
  
  return path;
}

/**
 * Check if the current URL matches our user code
 */
export function isOwnProfile(pathname: string): boolean {
  const { userCode } = parseProfileUrl(pathname);
  if (!userCode) return false;
  return userCode === getUserCode();
}