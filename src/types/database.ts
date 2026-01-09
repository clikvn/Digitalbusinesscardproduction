// Database schema types (maps directly to Supabase tables)

export interface DbBusinessCard {
  id: string;
  user_id: string;
  user_code: string;
  
  // Personal Info
  name: string;
  title: string | null;
  company_name: string | null;
  bio: string | null;
  
  // Contact Info
  email: string | null;
  phone: string | null;
  website_url: string | null;
  
  // Images
  avatar_url: string | null;
  background_image_url: string | null;
  logo_url: string | null;
  
  // Social Links
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  
  // Portfolio (array of image URLs)
  portfolio_images: string[] | null;
  
  // Custom fields (stores complex nested data from legacy BusinessCardData)
  custom_fields: {
    contact?: any;
    socialMessaging?: any;
    socialChannels?: any;
    portfolio?: any;
    portfolioCategories?: any;
    profile?: any;
    customLabels?: any;
    profileImage?: any;
    aiAgentVisible?: boolean;
  };
  
  created_at: string;
  updated_at: string;
}

export interface DbShareSettings {
  id: string;
  user_id: string;
  user_code: string;
  
  hide_email: boolean;
  hide_phone: boolean;
  hide_social: boolean;
  hide_portfolio: boolean;
  
  // Stores groupShareSettings
  custom_settings: {
    groupShareSettings?: any;
  };
  
  created_at: string;
  updated_at: string;
}

export interface DbCustomGroup {
  id: string;
  user_id: string;
  user_code: string;
  group_name: string;
  description: string | null;
  visible_fields: string[];
  created_at: string;
  updated_at: string;
}

export interface DbContact {
  id: string;
  user_code: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  saved_at: string;
}

export interface DbAnalyticsEvent {
  id: string;
  user_code: string;
  event_type: string;
  event_data: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
}

export interface DbUserCodeOwnership {
  user_code: string;
  user_id: string;
  created_at: string;
}

// New share configuration tables
export interface DbUserShareGroup {
  id: string;                    // 'public', 'private', 'custom-123'
  user_id: string;
  user_code: string;
  label: string;
  description: string | null;
  share_code: string;            // 6-character alphanumeric code
  icon: string;                  // Lucide icon name
  color: string;                 // Tailwind color prefix
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbUserShareSettings {
  id: string;
  user_id: string;
  user_code: string;
  group_id: string;              // References DbUserShareGroup.id
  visible_fields: string[];      // Array of field paths
  created_at: string;
  updated_at: string;
}

// ============================================
// Business Management Types
// ============================================

export type FieldPermissionLevel = 'editable' | 'readonly' | 'hidden';

export interface DbBusinessManagement {
  id: string;
  business_owner_user_id: string;
  employee_user_id: string;
  employee_code: string | null;
  role: string | null;
  department: string | null;
  is_active: boolean;
  field_permissions: Record<string, FieldPermissionLevel>;
  created_at: string;
  updated_at: string;
}

// Extended type with joined data from RPC function
export interface EmployeeWithDetails {
  id: string;
  employee_user_id: string;
  employee_code: string | null;
  role: string | null;
  department: string | null;
  is_active: boolean;
  user_email: string;
  user_code: string;
  employee_name: string | null;
  avatar_url: string | null;
  field_permissions: Record<string, FieldPermissionLevel>;
  created_at: string;
}

export interface BusinessOwnerInfo {
  business_owner_user_id: string;
  business_owner_email: string;
  business_owner_user_code: string;
  business_owner_name: string | null;
  is_active: boolean;
  field_permissions: Record<string, FieldPermissionLevel>;
}