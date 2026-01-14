export interface PortfolioCategory {
  id: string;
  name: string;
}

export type PortfolioItemType = 'images' | 'video' | 'virtual-tour';

export interface PortfolioItem {
  id: string;
  type: PortfolioItemType;
  title: string;
  description: string;
  categoryId: string;
  // For images type
  images?: string[];
  // For video type
  videoUrl?: string;
  // For virtual tour type
  tourUrl?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
}

export type VisibilityGroup = 'Public' | 'Private' | 'Business' | 'Personal';

// Updated to support dynamic group IDs
export interface GroupShareSettings {
  [groupId: string]: string[]; // Array of visible field paths for any group ID
}

export interface ProfileImageData {
  imageUrl: string;
  facePosition?: {
    x: number; // percentage from left (0-100)
    y: number; // percentage from top (0-100)
    width: number; // percentage of image width (0-100)
    height: number; // percentage of image height (0-100)
  } | null;
  // Drag/zoom positioning for home background
  position?: {
    x: number; // horizontal offset in pixels
    y: number; // vertical offset in pixels
    scale: number; // zoom level (1.0 = 100%)
  };
  // Drag/zoom positioning for circular avatar
  avatarPosition?: {
    x: number; // horizontal offset in pixels
    y: number; // vertical offset in pixels
    scale: number; // zoom level (1.0 = 100%)
  };
}

// ============================================
// UPDATED: Clean JSONB Structure
// ============================================
// All fields now use plain values (strings)
// Visibility controlled via user_share_settings table
// No more "groups" arrays in the data structure

export interface BusinessCardData {
  personal: {
    name: string;
    title: string;
    businessName: string;
    bio: string;
    profileImage: string; // JSON string of ProfileImageData or empty string
  };
  contact: {
    phone: string;        // ✅ Plain value (was: { value, groups })
    email: string;        // ✅ Plain value
    address: string;      // ✅ Plain value
  };
  socialMessaging: {
    zalo: string;         // ✅ Plain username (was: { username, groups })
    messenger: string;    // ✅ Plain username
    telegram: string;     // ✅ Plain username
    whatsapp: string;     // ✅ Plain username
    kakao: string;        // ✅ Plain username
    discord: string;      // ✅ Plain username
    wechat: string;       // ✅ Plain username
  };
  socialChannels: {
    facebook: string;     // ✅ Plain username (was: { username, groups })
    linkedin: string;     // ✅ Plain username
    twitter: string;      // ✅ Plain username
    youtube: string;      // ✅ Plain username
    tiktok: string;       // ✅ Plain username
  };
  portfolioCategories: PortfolioCategory[];
  portfolio: PortfolioItem[];
  profile: {
    about: string;            // ✅ Plain text (was: { value, groups })
    serviceAreas: string;     // ✅ Plain text
    specialties: string;      // ✅ Plain text
    experience: string;       // ✅ Plain text
    languages: string;        // ✅ Plain text
    certifications: string;   // ✅ Plain text
  };
  groupShareSettings?: GroupShareSettings; // Field visibility per contact group (from user_share_settings table)
  customLabels?: {
    // Home section
    'personal.name'?: string;
    'personal.title'?: string;
    'personal.businessName'?: string;
    'personal.bio'?: string;
    // Contact section
    'contact.phone'?: string;
    'contact.email'?: string;
    'contact.address'?: string;
    'contact.messaging'?: string;
    'contact.socialChannels'?: string;
    // Profile section
    'profile.about'?: string;
    'profile.serviceAreas'?: string;
    'profile.specialties'?: string;
    'profile.experience'?: string;
    'profile.languages'?: string;
    'profile.certifications'?: string;
    // Portfolio section
    'portfolio.title'?: string;
  };
  aiAgentVisible?: boolean;
}

export const defaultBusinessCardData: BusinessCardData = {
  personal: {
    name: "Christine Nguyen",
    title: "Interior Designer",
    businessName: "Design Solutions",
    bio: "Transforming spaces into works of art. Specializing in modern, minimalist designs that blend functionality with elegance.",
    profileImage: ""
  },
  contact: {
    phone: "+84 123 456 789",           // ✅ Plain value
    email: "christine@example.com",     // ✅ Plain value
    address: "123 Design Street, District 1, Ho Chi Minh City"  // ✅ Plain value
  },
  socialMessaging: {
    zalo: "",                           // ✅ Plain username
    messenger: "christinenguyen",       // ✅ Plain username
    telegram: "christinenguyen",
    whatsapp: "84123456789",
    kakao: "christinenguyen",
    discord: "christinenguyen",
    wechat: ""
  },
  socialChannels: {
    facebook: "christinenguyen.interiordesign",  // ✅ Plain username
    linkedin: "christinenguyen",
    twitter: "christinenguyen",
    youtube: "christinenguyen",
    tiktok: "christinenguyen"
  },
  portfolioCategories: [],
  portfolio: [],
  profile: {
    about: "It is my pleasure to assist you with your real estate needs. My number one goal is your complete satisfaction. I would like to take ...",  // ✅ Plain text
    serviceAreas: "Hanoi • Ha Tay • Hoa Binh • Bac Ninh",
    specialties: "Buyer's Agent • Seller's Agent • Resale • Apartment • Townhouse • Land",
    experience: "It is my pleasure to assist you with your real estate needs. My number one goal is your complete satisfaction. I would like to take ...",
    languages: "Vietnamese • English • Korean",
    certifications: "HN-1108"
  }
};

// Empty template for new users
export const emptyBusinessCardData: BusinessCardData = {
  personal: {
    name: "",
    title: "",
    businessName: "",
    bio: "",
    profileImage: ""
  },
  contact: {
    phone: "",      // ✅ Plain value
    email: "",      // ✅ Plain value
    address: ""     // ✅ Plain value
  },
  socialMessaging: {
    zalo: "",       // ✅ Plain username
    messenger: "",
    telegram: "",
    whatsapp: "",
    kakao: "",
    discord: "",
    wechat: ""
  },
  socialChannels: {
    facebook: "",   // ✅ Plain username
    linkedin: "",
    twitter: "",
    youtube: "",
    tiktok: ""
  },
  portfolioCategories: [],
  portfolio: [],
  profile: {
    about: "",              // ✅ Plain text
    serviceAreas: "",
    specialties: "",
    experience: "",
    languages: "",
    certifications: ""
  }
};

// Helper functions to construct URLs from usernames
export const messagingUrlPatterns = {
  zalo: (username: string) => username ? `https://zalo.me/${username}` : '',
  messenger: (username: string) => username ? `https://m.me/${username}` : '',
  telegram: (username: string) => username ? `https://t.me/${username}` : '',
  whatsapp: (username: string) => username ? `https://wa.me/${username}` : '',
  kakao: (username: string) => username ? `kakaotalk://conversations/${username}` : '',
  discord: (username: string) => username ? `https://discord.com/users/${username}` : '',
  wechat: (username: string) => username ? `weixin://dl/chat?${username}` : '',
};

export const socialChannelUrlPatterns = {
  facebook: (username: string) => {
    if (!username) return '';
    // If username is numeric (looks like a Facebook ID), use profile.php?id= format
    // Otherwise, use regular username format
    if (/^\d+$/.test(username.trim())) {
      return `https://www.facebook.com/profile.php?id=${username.trim()}`;
    }
    return `https://www.facebook.com/${username.trim()}`;
  },
  linkedin: (username: string) => username ? `https://linkedin.com/in/${username}` : '',
  twitter: (username: string) => username ? `https://twitter.com/${username}` : '',
  youtube: (username: string) => username ? `https://youtube.com/@${username}` : '',
  tiktok: (username: string) => username ? `https://tiktok.com/@${username}` : '',
};
