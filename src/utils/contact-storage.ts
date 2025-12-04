import { Contact, ContactGroup } from '../types/contacts';

const STORAGE_KEY = 'contacts';

// Migration mapping from old groups to new groups
const GROUP_MIGRATION_MAP: Record<string, ContactGroup> = {
  'high-potential': 'business',
  'business-partner': 'business',
  'low-potential': 'personal',
};

// Migrate old contact groups to new groups
function migrateContactGroups(contacts: Contact[]): Contact[] {
  return contacts.map(contact => {
    const oldGroup = contact.group as string;
    if (GROUP_MIGRATION_MAP[oldGroup]) {
      return {
        ...contact,
        group: GROUP_MIGRATION_MAP[oldGroup]
      };
    }
    return contact;
  });
}

export function loadContacts(): Contact[] {
  // Legacy support: returns empty array. Use useContacts hook instead.
  return [];
}

export function saveContacts(contacts: Contact[]): void {
  console.warn('saveContacts is deprecated. Use useContacts hook instead.');
}

export function addContact(contact: Omit<Contact, 'id' | 'createdAt'>): Contact {
  console.warn('addContact is deprecated. Use useContacts hook instead.');
  const newContact: Contact = {
    ...contact,
    id: Date.now().toString(),
    createdAt: Date.now()
  };
  return newContact;
}

export function deleteContact(id: string): void {
  console.warn('deleteContact is deprecated. Use useContacts hook instead.');
}

export function updateContact(id: string, updates: Partial<Contact>): void {
  console.warn('updateContact is deprecated. Use useContacts hook instead.');
}

export function getContactsByGroup(group: ContactGroup): Contact[] {
  // Legacy support
  return [];
}

export function getContactGroupCounts(): Record<ContactGroup, number> {
  // Legacy support
  return {
    'public': 0,
    'private': 0,
    'business': 0,
    'personal': 0
  };
}

function getDefaultContacts(): Contact[] {
  return [];
}