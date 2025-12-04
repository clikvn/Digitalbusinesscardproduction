export interface Contact {
  id: string;
  name: string;
  title: string;
  avatar: string;
  group: string; // Changed to string to support dynamic group IDs
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  contactCode?: string; // Unique code for individual contact tracking
  createdAt: number;
  isGroupShare?: boolean; // Flag to indicate this represents a group share
}

// Legacy type for backward compatibility
export type ContactGroup = 'public' | 'private' | 'business' | 'personal';

export interface ContactGroupData {
  id: string; // Changed to string to support dynamic group IDs
  label: string;
  count: number;
}

// Legacy constant for backward compatibility
export const CONTACT_GROUPS: Record<ContactGroup, string> = {
  'public': 'Public',
  'private': 'Private',
  'business': 'Business',
  'personal': 'Personal'
};