import { BusinessCardData, defaultBusinessCardData } from "../types/business-card";
import { getUserCode } from "./user-code";

const STORAGE_KEY_PREFIX = "business_card_data";
const PASSWORD_KEY = "business_card_password";

/**
 * Get storage key for a specific user
 */
function getStorageKey(userCode?: string): string {
  const code = userCode || getUserCode();
  return `${STORAGE_KEY_PREFIX}_${code}`;
}

/**
 * Check if a user exists (has data in localStorage)
 */
export function userExists(userCode: string): boolean {
  try {
    const key = `${STORAGE_KEY_PREFIX}_${userCode}`;
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
}

/**
 * Ensure default user exists with sample data
 */
export function ensureDefaultUserExists(): void {
  const DEFAULT_USER = 'myclik';
  if (!userExists(DEFAULT_USER)) {
    console.log('[Storage] Creating default user:', DEFAULT_USER);
    // Create default user with default data
    const defaultData = { ...defaultBusinessCardData };
    saveBusinessCardData(defaultData, DEFAULT_USER);
  }
}

export function saveBusinessCardData(data: BusinessCardData, userCode?: string): void {
  try {
    const key = getStorageKey(userCode);
    localStorage.setItem(key, JSON.stringify(data));
    
    // Dispatch custom event for real-time sync
    window.dispatchEvent(new CustomEvent('businessCardDataUpdated', {
      detail: { userCode: userCode || getUserCode(), data }
    }));
  } catch (error) {
    console.error("Error saving business card data:", error);
  }
}

export function loadBusinessCardData(userCode?: string): BusinessCardData {
  try {
    const key = getStorageKey(userCode);
    let stored = localStorage.getItem(key);
    
    // Migration: If user-specific key doesn't exist, check for legacy key
    if (!stored && !userCode) {
      const legacyKey = STORAGE_KEY_PREFIX; // Old key was just "business_card_data"
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        // Migrate old data to new user-specific key
        localStorage.setItem(key, legacyData);
        stored = legacyData;
        console.log('[Storage] Migrated legacy data to user-specific key:', key);
      }
    }
    
    if (stored) {
      const data = JSON.parse(stored);
      
      // Migration: Convert old contact string format to new object format
      if (data.contact) {
        if (typeof data.contact.phone === 'string') {
          data.contact.phone = {
            value: data.contact.phone,
            groups: data.contact.phone ? ['Public'] : []
          };
        }
        if (typeof data.contact.email === 'string') {
          data.contact.email = {
            value: data.contact.email,
            groups: data.contact.email ? ['Public'] : []
          };
        }
        if (typeof data.contact.address === 'string') {
          data.contact.address = {
            value: data.contact.address,
            groups: data.contact.address ? ['Public'] : []
          };
        }
      }
      
      // Migration: Convert old string format to new object format
      if (data.socialMessaging) {
        Object.keys(data.socialMessaging).forEach((key) => {
          if (typeof data.socialMessaging[key] === 'string') {
            // Extract username from URL
            const url = data.socialMessaging[key];
            let username = '';
            
            if (url) {
              if (key === 'zalo' && url.includes('zalo.me/')) {
                username = url.split('zalo.me/')[1] || '';
              } else if (key === 'messenger' && url.includes('m.me/')) {
                username = url.split('m.me/')[1] || '';
              } else if (key === 'telegram' && url.includes('t.me/')) {
                username = url.split('t.me/')[1] || '';
              } else if (key === 'whatsapp' && url.includes('wa.me/')) {
                username = url.split('wa.me/')[1] || '';
              } else if (key === 'kakao' && url.includes('conversations/')) {
                username = url.split('conversations/')[1] || '';
              } else if (key === 'discord' && url.includes('users/')) {
                username = url.split('users/')[1] || '';
              } else if (key === 'wechat' && url.includes('chat?')) {
                username = url.split('chat?')[1] || '';
              }
            }
            
            data.socialMessaging[key] = {
              username,
              groups: username ? ['Public'] : []
            };
          }
        });
      }
      
      if (data.socialChannels) {
        Object.keys(data.socialChannels).forEach((key) => {
          if (typeof data.socialChannels[key] === 'string') {
            // Extract username from URL
            const url = data.socialChannels[key];
            let username = '';
            
            if (url) {
              if (key === 'facebook' && url.includes('facebook.com/')) {
                username = url.split('facebook.com/')[1] || '';
              } else if (key === 'linkedin' && url.includes('linkedin.com/in/')) {
                username = url.split('linkedin.com/in/')[1] || '';
              } else if (key === 'twitter' && url.includes('twitter.com/')) {
                username = url.split('twitter.com/')[1] || '';
              } else if (key === 'youtube' && url.includes('youtube.com/@')) {
                username = url.split('youtube.com/@')[1] || '';
              } else if (key === 'tiktok' && url.includes('tiktok.com/@')) {
                username = url.split('tiktok.com/@')[1] || '';
              }
            }
            
            data.socialChannels[key] = {
              username,
              groups: username ? ['Public'] : []
            };
          }
        });
      }
      
      // Migration: Convert old profile structure (education/experience/skills arrays) to new structure
      if (data.profile && (Array.isArray(data.profile.education) || Array.isArray(data.profile.experience) || Array.isArray(data.profile.skills))) {
        data.profile = {
          about: { value: data.personal?.bio || "", groups: ['Public'] },
          serviceAreas: { value: "", groups: ['Public'] },
          specialties: { value: Array.isArray(data.profile.skills) ? data.profile.skills.join(' • ') : "", groups: ['Public'] },
          experience: { value: "", groups: ['Public'] },
          languages: { value: "", groups: ['Public'] },
          certifications: { value: "", groups: ['Public'] }
        };
      }
      
      // Migration: Convert old profile string format to new object format
      if (data.profile) {
        if (typeof data.profile.about === 'string') {
          data.profile.about = {
            value: data.profile.about,
            groups: data.profile.about ? ['Public'] : []
          };
        }
        if (typeof data.profile.serviceAreas === 'string') {
          data.profile.serviceAreas = {
            value: data.profile.serviceAreas,
            groups: data.profile.serviceAreas ? ['Public'] : []
          };
        }
        if (typeof data.profile.specialties === 'string') {
          data.profile.specialties = {
            value: data.profile.specialties,
            groups: data.profile.specialties ? ['Public'] : []
          };
        }
        if (typeof data.profile.experience === 'string') {
          data.profile.experience = {
            value: data.profile.experience,
            groups: data.profile.experience ? ['Public'] : []
          };
        }
        if (typeof data.profile.languages === 'string') {
          data.profile.languages = {
            value: data.profile.languages,
            groups: data.profile.languages ? ['Public'] : []
          };
        }
        if (typeof data.profile.certifications === 'string') {
          data.profile.certifications = {
            value: data.profile.certifications,
            groups: data.profile.certifications ? ['Public'] : []
          };
        }
      }
      
      // Migration: Add businessName if missing
      if (data.personal && !data.personal.businessName) {
        data.personal.businessName = '';
      }
      
      // Migration: Add portfolioCategories if missing
      if (!data.portfolioCategories) {
        data.portfolioCategories = [];
      }
      
      // Migration: Convert old category string to categoryId
      if (data.portfolio && Array.isArray(data.portfolio)) {
        data.portfolio = data.portfolio.map((item: any) => {
          // Add type field if missing (default to 'images' for old data)
          if (!item.type) {
            item.type = 'images';
          }
          
          if (item.category && !item.categoryId) {
            // Assign to first available category or empty string
            const firstCategory = data.portfolioCategories?.[0]?.id || '';
            return {
              ...item,
              categoryId: firstCategory,
              category: undefined
            };
          }
          return item;
        });
      }
      
      return data;
    }
  } catch (error) {
    console.error("Error loading business card data:", error);
  }
  return defaultBusinessCardData;
}

export function savePassword(password: string): void {
  try {
    localStorage.setItem(PASSWORD_KEY, password);
  } catch (error) {
    console.error("Error saving password:", error);
  }
}

export function getPassword(): string | null {
  try {
    return localStorage.getItem(PASSWORD_KEY);
  } catch (error) {
    console.error("Error getting password:", error);
    return null;
  }
}

export function verifyPassword(password: string): boolean {
  const stored = getPassword();
  if (!stored) return false;
  return stored === password;
}

export function hasPassword(): boolean {
  return getPassword() !== null;
}

export function exportData(): string {
  const data = loadBusinessCardData();
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as BusinessCardData;
    saveBusinessCardData(data);
    return true;
  } catch (error) {
    console.error("Error importing data:", error);
    return false;
  }
}