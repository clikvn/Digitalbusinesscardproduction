import { BusinessCardData, GroupShareSettings } from '../types/business-card';
import { ContactGroup } from '../types/contacts';

/**
 * Check if a field should be visible based on group settings
 */
function isFieldVisible(fieldPath: string, group: ContactGroup | null, settings: GroupShareSettings): boolean {
  if (!group) {
    console.warn(`[FilteredData] No group specified for field '${fieldPath}', defaulting to visible`);
    return true;
  }
  
  const groupSettings = settings[group];
  if (!groupSettings) {
    console.warn(`[FilteredData] No settings found for group '${group}', defaulting to hidden`);
    return false;
  }
  
  const isVisible = groupSettings.includes(fieldPath);
  return isVisible;
}

/**
 * Deep clone an object
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Pure function to filter business card data based on group visibility settings
 * 
 * IMPORTANT: This function works with the CLEAN data structure where all fields are plain strings,
 * NOT nested objects with { value, groups } or { username, groups }.
 */
export function filterBusinessCardData(
  data: BusinessCardData, 
  settings: GroupShareSettings, 
  group: ContactGroup | null
): BusinessCardData {
  console.log('[FilteredData] Starting filter:', {
    group,
    settingsKeys: Object.keys(settings),
    hasGroupSettings: group ? !!settings[group] : false,
    visibleFieldsCount: group && settings[group] ? settings[group].length : 0
  });
  
  // Clone data to avoid mutations
  const filtered = deepClone(data);
  
  // ============================================
  // Filter personal fields (all plain strings)
  // ============================================
  if (!isFieldVisible('personal.name', group, settings)) {
    filtered.personal.name = '';
  }
  if (!isFieldVisible('personal.title', group, settings)) {
    filtered.personal.title = '';
  }
  if (!isFieldVisible('personal.businessName', group, settings)) {
    filtered.personal.businessName = '';
  }
  if (!isFieldVisible('personal.bio', group, settings)) {
    filtered.personal.bio = '';
  }
  if (!isFieldVisible('personal.profileImage', group, settings)) {
    filtered.personal.profileImage = '';
  }
  
  // ============================================
  // Filter contact fields (plain strings, NOT .value)
  // ============================================
  if (!isFieldVisible('contact.phone', group, settings)) {
    filtered.contact.phone = '';  // ✅ Direct string assignment
  }
  if (!isFieldVisible('contact.email', group, settings)) {
    filtered.contact.email = '';  // ✅ Direct string assignment
  }
  if (!isFieldVisible('contact.address', group, settings)) {
    filtered.contact.address = '';  // ✅ Direct string assignment
  }
  
  // ============================================
  // Filter social messaging (plain strings, NOT .username)
  // ============================================
  if (!isFieldVisible('socialMessaging.zalo', group, settings)) {
    filtered.socialMessaging.zalo = '';  // ✅ Direct string assignment
  }
  if (!isFieldVisible('socialMessaging.messenger', group, settings)) {
    filtered.socialMessaging.messenger = '';
  }
  if (!isFieldVisible('socialMessaging.telegram', group, settings)) {
    filtered.socialMessaging.telegram = '';
  }
  if (!isFieldVisible('socialMessaging.whatsapp', group, settings)) {
    filtered.socialMessaging.whatsapp = '';
  }
  if (!isFieldVisible('socialMessaging.kakao', group, settings)) {
    filtered.socialMessaging.kakao = '';
  }
  if (!isFieldVisible('socialMessaging.discord', group, settings)) {
    filtered.socialMessaging.discord = '';
  }
  if (!isFieldVisible('socialMessaging.wechat', group, settings)) {
    filtered.socialMessaging.wechat = '';
  }
  
  // ============================================
  // Filter social channels (plain strings, NOT .username)
  // ============================================
  if (!isFieldVisible('socialChannels.facebook', group, settings)) {
    filtered.socialChannels.facebook = '';  // ✅ Direct string assignment
  }
  if (!isFieldVisible('socialChannels.linkedin', group, settings)) {
    filtered.socialChannels.linkedin = '';
  }
  if (!isFieldVisible('socialChannels.twitter', group, settings)) {
    filtered.socialChannels.twitter = '';
  }
  if (!isFieldVisible('socialChannels.youtube', group, settings)) {
    filtered.socialChannels.youtube = '';
  }
  if (!isFieldVisible('socialChannels.tiktok', group, settings)) {
    filtered.socialChannels.tiktok = '';
  }
  
  // ============================================
  // Filter profile fields (plain strings, NOT .value)
  // ============================================
  if (!isFieldVisible('profile.about', group, settings)) {
    filtered.profile.about = '';  // ✅ Direct string assignment
  }
  if (!isFieldVisible('profile.serviceAreas', group, settings)) {
    filtered.profile.serviceAreas = '';
  }
  if (!isFieldVisible('profile.specialties', group, settings)) {
    filtered.profile.specialties = '';
  }
  if (!isFieldVisible('profile.experience', group, settings)) {
    filtered.profile.experience = '';
  }
  if (!isFieldVisible('profile.languages', group, settings)) {
    filtered.profile.languages = '';
  }
  if (!isFieldVisible('profile.certifications', group, settings)) {
    filtered.profile.certifications = '';
  }
  
  // ============================================
  // Filter portfolio
  // ============================================
  if (!isFieldVisible('portfolio', group, settings)) {
    filtered.portfolio = [];
    filtered.portfolioCategories = [];
  }
  
  // ============================================
  // Set AI Agent visibility
  // ============================================
  filtered.aiAgentVisible = isFieldVisible('contact.aiAgent', group, settings);

  console.log('[FilteredData] Filtering complete:', {
    hasName: !!filtered.personal.name,
    hasEmail: !!filtered.contact.email,
    hasPhone: !!filtered.contact.phone,
    portfolioCount: filtered.portfolio.length
  });

  return filtered;
}

/**
 * DEPRECATED: Use the logic in usePublicBusinessCard.ts instead
 */
export function resolveContactGroup(groupCodeOrId?: string): ContactGroup | null {
  console.warn('[FilteredData] resolveContactGroup is deprecated. Use usePublicBusinessCard logic instead.');
  
  if (!groupCodeOrId) {
    return 'public';
  }
  
  if (['public', 'private', 'business', 'personal'].includes(groupCodeOrId)) {
    return groupCodeOrId as ContactGroup;
  }
  
  return 'public';
}
