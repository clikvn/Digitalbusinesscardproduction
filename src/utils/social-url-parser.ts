/**
 * Utility functions to extract username/ID from social media URLs
 * Handles both full URLs and plain usernames/IDs
 */

/**
 * Extract username/ID from Zalo URL or return as-is if already a username/ID
 * Examples:
 * - "https://zalo.me/0902452024" -> "0902452024"
 * - "0902452024" -> "0902452024"
 * - "zalo.me/0902452024" -> "0902452024"
 */
export function extractZaloUsername(value: string): string {
  if (!value) return value;
  
  // Try to match various URL formats
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?zalo\.me\/([^\/\s?#]+)/i,
    /zalo\.me\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If no URL pattern matches, return as-is (already a username/ID)
  return value.trim();
}

/**
 * Extract username/ID from Messenger URL or return as-is
 */
export function extractMessengerUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?m\.me\/([^\/\s?#]+)/i,
    /facebook\.com\/messages\/t\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return value.trim();
}

/**
 * Extract username/ID from Telegram URL or return as-is
 */
export function extractTelegramUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?t\.me\/([^\/\s?#]+)/i,
    /telegram\.me\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      // Remove @ if present
      return match[1].replace(/^@/, '').trim();
    }
  }
  
  // Remove @ if present in plain username
  return value.replace(/^@/, '').trim();
}

/**
 * Extract username/ID from WhatsApp URL or return as-is
 */
export function extractWhatsAppUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?wa\.me\/([^\/\s?#]+)/i,
    /whatsapp\.com\/send\?phone=([^&\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      // Remove + if present, keep numbers only
      return match[1].replace(/[^\d]/g, '');
    }
  }
  
  // Remove non-digits for phone number format
  return value.replace(/[^\d+]/g, '');
}

/**
 * Extract username/ID from KakaoTalk URL or return as-is
 */
export function extractKakaoUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /kakaotalk:\/\/conversations\/([^\/\s?#]+)/i,
    /kakaotalk\.com\/conversations\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return value.trim();
}

/**
 * Extract username/ID from Discord URL or return as-is
 */
export function extractDiscordUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?discord\.com\/users\/([^\/\s?#]+)/i,
    /discord\.gg\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return value.trim();
}

/**
 * Extract username/ID from WeChat URL or return as-is
 */
export function extractWeChatUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /weixin:\/\/dl\/chat\?([^&\s?#]+)/i,
    /wechat:\/\/dl\/chat\?([^&\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return value.trim();
}

/**
 * Extract username/ID from Facebook URL or return as-is
 * Supports multiple Facebook URL formats:
 * - https://facebook.com/vuphamtrantuan
 * - https://www.facebook.com/vuphamtrantuan
 * - https://www.facebook.com/profile.php?id=100054995627099
 * - fb.com/username
 */
export function extractFacebookUsername(value: string): string {
  if (!value) return value;
  
  const trimmed = value.trim();
  
  // Handle profile.php?id= format
  // Match: https://www.facebook.com/profile.php?id=100054995627099
  const profileIdPattern = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/profile\.php\?id=([^&\s?#]+)/i;
  const profileIdMatch = trimmed.match(profileIdPattern);
  if (profileIdMatch && profileIdMatch[1]) {
    return profileIdMatch[1].trim();
  }
  
  // Handle regular username format
  // Match: https://facebook.com/vuphamtrantuan or https://www.facebook.com/vuphamtrantuan
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([^\/\s?#]+)/i,
    /fb\.com\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const username = match[1].trim();
      // Skip common Facebook paths that aren't usernames
      if (username && 
          !username.startsWith('profile.php') && 
          !username.startsWith('pages') &&
          !username.startsWith('groups') &&
          !username.startsWith('events') &&
          !username.startsWith('watch')) {
        return username;
      }
    }
  }
  
  // If no URL pattern matches, return as-is (already a username/ID)
  return trimmed;
}

/**
 * Extract username/ID from LinkedIn URL or return as-is
 */
export function extractLinkedInUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^\/\s?#]+)/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/pub\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return value.trim();
}

/**
 * Extract username/ID from Twitter/X URL or return as-is
 */
export function extractTwitterUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      // Skip common Twitter paths
      const username = match[1].trim();
      if (username && !['intent', 'i', 'hashtag'].includes(username.toLowerCase())) {
        // Remove @ if present
        return username.replace(/^@/, '');
      }
    }
  }
  
  // Remove @ if present in plain username
  return value.replace(/^@/, '').trim();
}

/**
 * Extract username/ID from YouTube URL or return as-is
 */
export function extractYouTubeUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([^\/\s?#]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([^\/\s?#]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([^\/\s?#]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Remove @ if present in plain username
  return value.replace(/^@/, '').trim();
}

/**
 * Extract username/ID from TikTok URL or return as-is
 */
export function extractTikTokUsername(value: string): string {
  if (!value) return value;
  
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([^\/\s?#]+)/i,
    /vm\.tiktok\.com\/([^\/\s?#]+)/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = value.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Remove @ if present in plain username
  return value.replace(/^@/, '').trim();
}

/**
 * Mapping of platform keys to their extraction functions
 */
export const messagingExtractors = {
  zalo: extractZaloUsername,
  messenger: extractMessengerUsername,
  telegram: extractTelegramUsername,
  whatsapp: extractWhatsAppUsername,
  kakao: extractKakaoUsername,
  discord: extractDiscordUsername,
  wechat: extractWeChatUsername,
};

export const socialChannelExtractors = {
  facebook: extractFacebookUsername,
  linkedin: extractLinkedInUsername,
  twitter: extractTwitterUsername,
  youtube: extractYouTubeUsername,
  tiktok: extractTikTokUsername,
};
