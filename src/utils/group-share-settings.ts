import { GroupShareSettings, BusinessCardData } from '../types/business-card';
import { ContactGroup } from '../types/contacts';

const STORAGE_KEY = 'groupShareSettings';

// Default fields that are visible for all groups
export const DEFAULT_VISIBLE_FIELDS = [
  'personal.name',
  'personal.title',
  'personal.businessName',
  'personal.profileImage',
  'contact.phone',
  'contact.email',
];

// All available fields that can be shared
export const ALL_SHAREABLE_FIELDS = [
  // Personal
  'personal.name',
  'personal.title',
  'personal.businessName',
  'personal.bio',
  'personal.profileImage',
  
  // Contact
  'contact.phone',
  'contact.email',
  'contact.address',
  
  // Social Messaging
  'socialMessaging.zalo',
  'socialMessaging.messenger',
  'socialMessaging.telegram',
  'socialMessaging.whatsapp',
  'socialMessaging.kakao',
  'socialMessaging.discord',
  'socialMessaging.wechat',
  
  // Social Channels
  'socialChannels.facebook',
  'socialChannels.linkedin',
  'socialChannels.twitter',
  'socialChannels.youtube',
  'socialChannels.tiktok',
  
  // Profile
  'profile.about',
  'profile.serviceAreas',
  'profile.specialties',
  'profile.experience',
  'profile.languages',
  'profile.certifications',
  
  // Portfolio
  'portfolio',
];

export const FIELD_LABELS: Record<string, string> = {
  'personal.name': 'Name',
  'personal.title': 'Title/Position',
  'personal.businessName': 'Business Name',
  'personal.bio': 'Bio',
  'personal.profileImage': 'Profile Image',
  
  'contact.phone': 'Phone Number',
  'contact.email': 'Email Address',
  'contact.address': 'Physical Address',
  
  'socialMessaging.zalo': 'Zalo',
  'socialMessaging.messenger': 'Messenger',
  'socialMessaging.telegram': 'Telegram',
  'socialMessaging.whatsapp': 'WhatsApp',
  'socialMessaging.kakao': 'KakaoTalk',
  'socialMessaging.discord': 'Discord',
  'socialMessaging.wechat': 'WeChat',
  
  'socialChannels.facebook': 'Facebook',
  'socialChannels.linkedin': 'LinkedIn',
  'socialChannels.twitter': 'Twitter',
  'socialChannels.youtube': 'YouTube',
  'socialChannels.tiktok': 'TikTok',
  
  'profile.about': 'About Me',
  'profile.serviceAreas': 'Service Areas',
  'profile.specialties': 'Specialties',
  'profile.experience': 'Experience',
  'profile.languages': 'Languages',
  'profile.certifications': 'Certifications',
  
  'portfolio': 'Portfolio',
};

export function getDefaultGroupShareSettings(): GroupShareSettings {
  return {
    'public': [...DEFAULT_VISIBLE_FIELDS],
    'private': [...DEFAULT_VISIBLE_FIELDS],
    'business': [...DEFAULT_VISIBLE_FIELDS],
    'personal': [...DEFAULT_VISIBLE_FIELDS],
  };
}

export function loadGroupShareSettings(): GroupShareSettings {
  // Legacy support: returns defaults
  return getDefaultGroupShareSettings();
}

export function saveGroupShareSettings(settings: GroupShareSettings): void {
  console.warn('saveGroupShareSettings is deprecated. Use useSettings hook instead.');
}

export function isFieldVisibleForGroup(fieldPath: string, group: ContactGroup, settings: GroupShareSettings): boolean {
  return settings[group]?.includes(fieldPath) || false;
}

export function toggleFieldForGroup(
  fieldPath: string,
  group: ContactGroup,
  settings: GroupShareSettings
): GroupShareSettings {
  const newSettings = { ...settings };
  const groupFields = [...(newSettings[group] || [])];
  
  const index = groupFields.indexOf(fieldPath);
  if (index > -1) {
    groupFields.splice(index, 1);
  } else {
    groupFields.push(fieldPath);
  }
  
  newSettings[group] = groupFields;
  return newSettings;
}

export function setFieldsForGroup(
  fields: string[],
  group: ContactGroup,
  settings: GroupShareSettings
): GroupShareSettings {
  return {
    ...settings,
    [group]: [...fields],
  };
}

// Helper to filter business card data based on group settings
export function filterDataByGroup(
  data: BusinessCardData,
  group: ContactGroup,
  settings: GroupShareSettings
): Partial<BusinessCardData> {
  const visibleFields = settings[group] || [];
  const filtered: any = {};
  
  visibleFields.forEach(fieldPath => {
    const parts = fieldPath.split('.');
    let current: any = data;
    let target: any = filtered;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) return;
      
      if (!target[part]) {
        target[part] = {};
      }
      current = current[part];
      target = target[part];
    }
    
    const lastPart = parts[parts.length - 1];
    if (current[lastPart] !== undefined) {
      target[lastPart] = current[lastPart];
    }
  });
  
  return filtered;
}