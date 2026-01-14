import { supabase } from './supabase-client';
import { BusinessCardData, GroupShareSettings } from '../types/business-card';
import { CustomGroup } from '../utils/custom-groups';
import { AnalyticsEvent } from '../types/analytics';
import { 
  DbBusinessCard, 
  DbShareSettings, 
  DbCustomGroup, 
  DbContact,
  DbAnalyticsEvent,
  DbUserCodeOwnership,
  DbUserShareGroup,
  DbUserShareSettings,
  EmployeeWithDetails,
  BusinessOwnerInfo,
  FieldPermissionLevel
} from '../types/database';
import { 
  businessCardToDb, 
  dbToBusinessCard, 
  shareSettingsToDb, 
  mergeShareSettings 
} from './transformers';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate email format (ULTRA LENIENT - accepts almost anything)
 * Since database no longer enforces constraints, we allow partial/incomplete emails
 * This prevents auto-save errors while user is typing
 */
function isValidEmail(email: string | null | undefined): boolean {
  // ✅ Accept ANY text - database treats this as plain text
  // Users can type partial emails like "j" or "john@" without errors
  return true;
}

/**
 * Validate phone format (ULTRA LENIENT - accepts almost anything)
 * Since database no longer enforces constraints, we allow partial/incomplete phone numbers
 * This prevents auto-save errors while user is typing
 */
function isValidPhone(phone: string | null | undefined): boolean {
  // ✅ Accept ANY text - database treats this as plain text
  // Users can type partial phones like "1" or "123" without errors
  return true;
}

/**
 * Verify or claim ownership of a user code
 */
async function verifyOrClaimOwnership(userCode: string, userId: string): Promise<boolean> {
  // Check if code is already owned
  const { data: existing } = await supabase
    .from('user_code_ownership')
    .select('user_id')
    .eq('user_code', userCode)
    .maybeSingle();

  if (existing) {
    // Code is owned - verify it's by this user
    return existing.user_id === userId;
  }

  // Code is unclaimed - claim it
  const { error } = await supabase
    .from('user_code_ownership')
    .insert({ user_code: userCode, user_id: userId });

  if (error) {
    console.error('Error claiming user code:', error);
    return false;
  }

  return true;
}

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  return user;
}

// ============================================
// BUSINESS CARD API
// ============================================

export const api = {
  card: {
    /**
     * Get a business card by user code (PUBLIC)
     */
    get: async (userCode: string): Promise<BusinessCardData | null> => {
      try {
        // Validate input
        if (!userCode || userCode.trim() === '') {
          console.warn('[API] Invalid user code provided');
          return null;
        }

        // Fetch business card with timeout
        let cardData, cardError;
        try {
          const result = await supabase
            .from('business_cards')
            .select('*')
            .eq('user_code', userCode)
            .maybeSingle();
          cardData = result.data;
          cardError = result.error;
        } catch (fetchError: any) {
          console.error('[API] Network error fetching card:', {
            message: fetchError?.message || 'Unknown error',
            type: fetchError?.constructor?.name || 'Unknown',
            userCode
          });
          return null;
        }

        if (cardError) {
          console.error('[API] Supabase error fetching card:', {
            message: cardError.message,
            hint: cardError.hint,
            code: cardError.code,
            details: cardError.details
          });
          return null;
        }

        // Skip check for default page (myclik)
        if (userCode === 'myclik') {
          // Default page - no employee status check needed, return null if no card data
          // The hook will handle it by returning defaultBusinessCardData
          if (!cardData) {
            console.log('[API] No card found for default user code, returning null:', userCode);
            return null;
          }
        } else {
          // Check if user exists first (before checking employee status)
          const { data: ownershipData } = await supabase
            .from('user_code_ownership')
            .select('user_id')
            .eq('user_code', userCode)
            .maybeSingle();

          // If no ownership data, user code doesn't exist
          if (!ownershipData) {
            console.log('[API] User code not found:', userCode);
            throw new Error('USER_CODE_NOT_FOUND');
          }

          // Check if this user is a deactivated employee - block access to their profile
          const { data: employeeStatus } = await supabase
            .rpc('check_employee_status', { p_user_id: ownershipData.user_id });

          // If user is an employee and account is deactivated, block access
          if (employeeStatus && employeeStatus.is_active === false) {
            console.log('[API] Access blocked: User is a deactivated employee:', userCode);
            throw new Error('EMPLOYEE_DEACTIVATED');
          }

          if (!cardData) {
            console.log('[API] No card found for user code:', userCode, '(This is normal if the user code doesn\'t exist)');
            throw new Error('USER_CODE_NOT_FOUND');
          }
        }

        // Fetch share settings
        const { data: settingsData } = await supabase
          .from('share_settings')
          .select('*')
          .eq('user_code', userCode)
          .maybeSingle();

        // Transform to legacy format
        let businessCard = dbToBusinessCard(cardData as DbBusinessCard);
        
        // Merge share settings
        if (settingsData) {
          businessCard = mergeShareSettings(businessCard, settingsData as DbShareSettings);
        }

        return businessCard;
      } catch (e: any) {
        // Re-throw specific errors (USER_CODE_NOT_FOUND, EMPLOYEE_DEACTIVATED)
        if (e?.message === 'USER_CODE_NOT_FOUND' || e?.message === 'EMPLOYEE_DEACTIVATED') {
          throw e;
        }
        
        console.error('[API] Unexpected error fetching card:', {
          message: e?.message || 'Unknown error',
          stack: e?.stack,
          userCode
        });
        // Return null for unexpected errors to prevent app crashes
        return null;
      }
    },

    /**
     * Save a business card (PROTECTED)
     */
    save: async (userCode: string, data: BusinessCardData) => {
      const user = await getCurrentUser();
      
      // Verify ownership
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden: You do not own this user code');
      }

      // ✅ NO VALIDATION NEEDED
      // Database accepts any text for email/phone fields
      // This allows auto-save to work seamlessly while user is typing
      // Client can add optional validation in the UI if needed

      // ✅ CRITICAL FIX: Preserve existing logo_url if not explicitly provided
      // Logo should only be updated when explicitly uploaded, not during auto-save
      let preservedLogoUrl: string | null = null;
      const dataLogoUrl = (data as any).logo_url;
      if (dataLogoUrl === undefined || dataLogoUrl === null) {
        // Fetch existing logo_url from database to preserve it
        const { data: existingCard } = await supabase
          .from('business_cards')
          .select('logo_url')
          .eq('user_code', userCode)
          .maybeSingle();
        preservedLogoUrl = existingCard?.logo_url || null;
      }

      // Transform to database format
      const dbCard = businessCardToDb(data, user.id, userCode);

      // Use preserved logo_url if data doesn't have one
      const logoUrlToSave = dataLogoUrl !== undefined && dataLogoUrl !== null 
        ? dbCard.logo_url 
        : preservedLogoUrl;

      // Upsert business card
      const { error: cardError } = await supabase
        .from('business_cards')
        .upsert({
          user_id: user.id,
          user_code: userCode,
          name: dbCard.name,
          title: dbCard.title,
          company_name: dbCard.company_name,
          bio: dbCard.bio,
          email: dbCard.email,
          phone: dbCard.phone,
          website_url: dbCard.website_url,
          avatar_url: dbCard.avatar_url,
          background_image_url: dbCard.background_image_url,
          logo_url: logoUrlToSave,
          linkedin_url: dbCard.linkedin_url,
          twitter_url: dbCard.twitter_url,
          instagram_url: dbCard.instagram_url,
          facebook_url: dbCard.facebook_url,
          portfolio_images: dbCard.portfolio_images,
          custom_fields: dbCard.custom_fields,
        }, {
          onConflict: 'user_code'
        });

      if (cardError) {
        console.error('Error saving card:', cardError);
        throw new Error(`Failed to save card: ${cardError.message}`);
      }

      // Upsert share settings
      const dbSettings = shareSettingsToDb(data, user.id, userCode);
      const { error: settingsError } = await supabase
        .from('share_settings')
        .upsert({
          user_id: user.id,
          user_code: userCode,
          hide_email: dbSettings.hide_email,
          hide_phone: dbSettings.hide_phone,
          hide_social: dbSettings.hide_social,
          hide_portfolio: dbSettings.hide_portfolio,
          custom_settings: dbSettings.custom_settings,
        }, {
          onConflict: 'user_code'
        });

      if (settingsError) {
        console.error('Error saving settings:', settingsError);
        // Don't throw - settings are secondary
      }

      return { success: true };
    },
  },

  // ============================================
  // SETTINGS API
  // ============================================

  settings: {
    /**
     * Get share settings (PUBLIC)
     * Fetches from new user_share_groups and user_share_settings tables
     */
    get: async (userCode: string) => {
      try {
        // Fetch groups with network error handling
        let groupsData, groupsError;
        try {
          const result = await supabase
            .from('user_share_groups')
            .select('*')
            .eq('user_code', userCode)
            .order('display_order');
          groupsData = result.data;
          groupsError = result.error;
        } catch (fetchError: any) {
          console.error('[API] Network error fetching groups:', {
            message: fetchError?.message || 'Unknown error',
            type: fetchError?.constructor?.name || 'Unknown',
            userCode
          });
          return { settings: {}, customGroups: [] };
        }

        if (groupsError) {
          console.error('[API] Supabase error fetching groups:', {
            message: groupsError.message,
            hint: groupsError.hint,
            code: groupsError.code,
            details: groupsError.details
          });
          return { settings: {}, customGroups: [] };
        }

        // Fetch settings for all groups with network error handling
        let settingsData, settingsError;
        try {
          const result = await supabase
            .from('user_share_settings')
            .select('*')
            .eq('user_code', userCode);
          settingsData = result.data;
          settingsError = result.error;
        } catch (fetchError: any) {
          console.error('[API] Network error fetching settings:', {
            message: fetchError?.message || 'Unknown error',
            type: fetchError?.constructor?.name || 'Unknown',
            userCode
          });
          // Continue with empty settings
          settingsData = [];
        }

        if (settingsError) {
          console.error('[API] Supabase error fetching settings:', {
            message: settingsError.message,
            hint: settingsError.hint,
            code: settingsError.code,
            details: settingsError.details
          });
        }

        // Transform groups to CustomGroup format
        const customGroups = (groupsData || []).map((g: DbUserShareGroup) => ({
          id: g.id,
          label: g.label,
          description: g.description || '',
          icon: g.icon,
          color: g.color,
          isDefault: g.is_default,
          createdAt: new Date(g.created_at).getTime(),
          shareCode: g.share_code,
        }));

        // Transform settings to GroupShareSettings format
        // GroupShareSettings is { [groupId]: string[] }
        const settings: GroupShareSettings = {};
        (settingsData || []).forEach((s: DbUserShareSettings) => {
          settings[s.group_id] = s.visible_fields;
        });

        return {
          settings,
          customGroups,
        };
      } catch (e) {
        console.error('Error fetching settings:', e);
        return { settings: {}, customGroups: [] };
      }
    },

    /**
     * Save share settings (PROTECTED)
     * Saves to new user_share_groups and user_share_settings tables
     */
    save: async (userCode: string, settings?: GroupShareSettings, customGroups?: CustomGroup[]) => {
      const user = await getCurrentUser();
      
      // Verify ownership
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden');
      }

      // Save groups if provided
      if (customGroups) {
        // Get existing groups
        const { data: existingGroups } = await supabase
          .from('user_share_groups')
          .select('id')
          .eq('user_code', userCode);

        const existingIds = new Set((existingGroups || []).map(g => g.id));
        const newIds = new Set(customGroups.map(g => g.id));

        // Delete groups that are no longer in the list (except defaults)
        const idsToDelete = Array.from(existingIds).filter(id => !newIds.has(id));
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('user_share_groups')
            .delete()
            .eq('user_code', userCode)
            .in('id', idsToDelete)
            .eq('is_default', false); // Only delete custom groups

          if (deleteError) {
            console.error('Error deleting groups:', deleteError);
          }
        }

        // Upsert all groups
        const dbGroups = customGroups.map(g => ({
          id: g.id,
          user_id: user.id,
          user_code: userCode,
          label: g.label,
          description: g.description,
          share_code: g.shareCode,
          icon: g.icon,
          color: g.color,
          is_default: g.isDefault,
          display_order: customGroups.indexOf(g),
        }));

        const { error: groupsError } = await supabase
          .from('user_share_groups')
          .upsert(dbGroups, {
            onConflict: 'id'
          });

        if (groupsError) {
          console.error('Error saving groups:', groupsError);
          throw new Error(`Failed to save groups: ${groupsError.message}`);
        }
      }

      // Save settings if provided
      if (settings) {
        // Upsert settings for each group
        // Note: Database has BOTH group_id and share_code columns (both NOT NULL)
        // We need to provide both by looking up the group data
        const settingsArray = Object.entries(settings).map(([groupId, visibleFields]) => {
          // Find the corresponding group to get its share_code
          const group = customGroups?.find(g => g.id === groupId);
          
          if (!group) {
            console.error(`Group not found for id: ${groupId}`);
            throw new Error(`Group not found: ${groupId}`);
          }
          
          return {
            user_id: user.id,
            user_code: userCode,
            group_id: groupId,           // e.g., 'public', 'private', or UUID_public
            share_code: group.shareCode, // e.g., 'ABC123' (6-char code)
            visible_fields: visibleFields,
          };
        });

        if (settingsArray.length > 0) {
          const { error: settingsError } = await supabase
            .from('user_share_settings')
            .upsert(settingsArray, {
              onConflict: 'user_code,group_id' // Matches unique index from migration 002_v2
            });

          if (settingsError) {
            console.error('Error saving settings:', settingsError);
            throw new Error(`Failed to save settings: ${settingsError.message}`);
          }
        }
      }

      return { success: true };
    },
  },

  // ============================================
  // CONTACTS API - RENAMED TO SHARE CONTACTS
  // ============================================
  // Individual tracked shares for engagement analytics
  // Each contact gets a unique URL: /user_code/group_code/contact_code

  contacts: {
    /**
     * Get contacts for a user code (LEGACY - use shareContacts.get instead)
     */
    get: async (userCode: string) => {
      return api.shareContacts.get(userCode);
    },

    /**
     * Save contacts (LEGACY - use shareContacts.save instead)
     */
    save: async (userCode: string, contacts: any[]) => {
      return api.shareContacts.save(userCode, contacts);
    },
  },

  // ============================================
  // SHARE CONTACTS API
  // ============================================
  // Individual tracked shares for engagement analytics
  // Each contact gets a unique URL: /user_code/group_code/contact_code

  shareContacts: {
    /**
     * Get share contacts for a user code (PROTECTED - owner only)
     */
    get: async (userCode: string) => {
      try {
        console.log('[shareContacts.get] Starting fetch for userCode:', userCode);
        
        const user = await getCurrentUser();
        console.log('[shareContacts.get] Current user:', user?.id);
        
        // Verify ownership (RLS will also check this)
        const isOwner = await verifyOrClaimOwnership(userCode, user.id);
        if (!isOwner) {
          console.error('[shareContacts.get] User is not owner of userCode:', userCode);
          throw new Error('Forbidden');
        }
        console.log('[shareContacts.get] Ownership verified');

        // Fetch groups to map share_code back to group ID
        const { data: groupsData, error: groupsError } = await supabase
          .from('user_share_groups')
          .select('id, share_code')
          .eq('user_code', userCode);

        if (groupsError) {
          console.error('[shareContacts.get] Error fetching groups for mapping:', groupsError);
          // Continue without mapping - will fallback to share_code as group
        }
        
        console.log('[shareContacts.get] Groups data:', groupsData);

        // Create reverse map: share_code -> group ID
        const shareCodeToGroupId = new Map<string, string>();
        (groupsData || []).forEach(g => {
          shareCodeToGroupId.set(g.share_code, g.id);
          console.log('[shareContacts.get] Mapped share_code:', g.share_code, '-> group ID:', g.id);
        });

        const { data, error } = await supabase
          .from('share_contacts')
          .select('*')
          .eq('user_code', userCode)
          .order('created_at', { ascending: false });

        console.log('[shareContacts.get] Raw contacts from DB:', data);
        console.log('[shareContacts.get] Query error:', error);

        if (error) {
          console.error('[shareContacts.get] Error fetching share contacts:', error);
          return [];
        }

        const mappedContacts = (data || []).map((c: any) => {
          // Map share_code back to group ID for UI compatibility
          const groupId = shareCodeToGroupId.get(c.share_code) || c.share_code;
          
          console.log('[shareContacts.get] Mapping contact:', {
            name: c.contact_name,
            share_code: c.share_code,
            mapped_group: groupId,
            contact_code: c.contact_code
          });
          
          return {
            id: c.id,
            name: c.contact_name || '',
            email: c.contact_email || '',
            phone: c.contact_phone || '',
            company: c.contact_company || '',
            notes: c.notes || '',
            group: groupId, // Return group ID, not share_code
            contactCode: c.contact_code,
            createdAt: new Date(c.created_at).getTime(),
            // Legacy fields for compatibility
            title: c.contact_company || 'Contact',
            avatar: '',
          };
        });
        
        console.log('[shareContacts.get] Final mapped contacts:', mappedContacts);
        return mappedContacts;
      } catch (e) {
        console.error('[shareContacts.get] Exception in shareContacts.get:', e);
        return [];
      }
    },

    /**
     * Save share contacts (PROTECTED - owner only)
     */
    save: async (userCode: string, contacts: any[]) => {
      const user = await getCurrentUser();
      
      // Verify ownership
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden');
      }

      // Fetch user's share groups to map group IDs to share codes
      const { data: groupsData, error: groupsError } = await supabase
        .from('user_share_groups')
        .select('id, share_code')
        .eq('user_code', userCode);

      if (groupsError) {
        console.error('Error fetching share groups:', groupsError);
        throw new Error(`Failed to fetch share groups: ${groupsError.message}`);
      }

      // Create a map from group ID to share code
      const groupIdToShareCode = new Map<string, string>();
      (groupsData || []).forEach(g => {
        groupIdToShareCode.set(g.id, g.share_code);
      });

      // Delete existing contacts
      await supabase
        .from('share_contacts')
        .delete()
        .eq('user_code', userCode);

      // Insert new contacts
      if (contacts.length > 0) {
        const dbContacts = contacts.map(c => {
          // Resolve group ID to share code
          const shareCode = c.group ? groupIdToShareCode.get(c.group) : null;
          
          if (!shareCode && c.group) {
            console.warn(`Warning: Could not find share code for group ID: ${c.group}`);
          }

          return {
            user_id: user.id,
            user_code: userCode,
            contact_name: c.name || null,
            contact_email: c.email || null,
            contact_phone: c.phone || null,
            contact_company: c.company || null,
            notes: c.notes || null,
            share_code: shareCode || 'public', // Fallback to 'public' if not found
            contact_code: c.contactCode || crypto.randomUUID().substring(0, 8),
          };
        });

        const { error } = await supabase
          .from('share_contacts')
          .insert(dbContacts);

        if (error) {
          console.error('Error saving share contacts:', error);
          throw new Error(`Failed to save share contacts: ${error.message}`);
        }
      }

      return { success: true };
    },

    /**
     * Create a new share contact with auto-generated contact code
     */
    create: async (userCode: string, contactData: {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      notes?: string;
      shareCode?: string;
    }) => {
      const user = await getCurrentUser();
      
      // Verify ownership
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden');
      }

      // Generate unique contact code
      const contactCode = crypto.randomUUID().substring(0, 8);

      const { data, error } = await supabase
        .from('share_contacts')
        .insert({
          user_id: user.id,
          user_code: userCode,
          contact_name: contactData.name,
          contact_email: contactData.email || null,
          contact_phone: contactData.phone || null,
          contact_company: contactData.company || null,
          notes: contactData.notes || null,
          share_code: contactData.shareCode || 'public',
          contact_code: contactCode,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating share contact:', error);
        throw new Error(`Failed to create share contact: ${error.message}`);
      }

      return {
        id: data.id,
        contactCode: data.contact_code,
        url: `/${userCode}/${data.share_code}/${data.contact_code}`,
      };
    },
  },

  // ============================================
  // ANALYTICS API
  // ============================================

  analytics: {
    /**
     * Track an analytics event (PUBLIC - fire and forget)
     */
    track: async (userCode: string, event: AnalyticsEvent) => {
      // Fire and forget - don't block UI
      supabase
        .from('analytics_events')
        .insert({
          user_code: userCode,
          event_type: event.eventType, // Fixed: was event.type
          event_data: event,
        })
        .then(({ error }) => {
          if (error) console.error('Analytics error:', error);
        });
    },

    /**
     * Get analytics events (PROTECTED - owner only)
     */
    get: async (userCode: string) => {
      const user = await getCurrentUser();
      
      // Verify ownership (RLS will also check this)
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden');
      }

      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_code', userCode)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },

    /**
     * Get real-time analytics summary (PROTECTED - owner only)
     * Queries the NEW analytics system for immediate results
     */
    getRealtime: async (userCode: string, filters?: { days?: number; contactCode?: string }) => {
      const user = await getCurrentUser();
      
      // Verify ownership
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden');
      }

      // Calculate date range (default: last 90 days for views, but we'll filter client-side)
      const daysAgo = filters?.days || 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Build contact filter if specified (database uses contact_id, not contact_code)
      const contactFilter = filters?.contactCode;

      // Query real-time views in parallel
      const [userStats, groupStats, dailyStats, clickTargets, pageStats] = await Promise.all([
        supabase
          .from('v_realtime_user_stats')
          .select('*')
          .eq('user_code', userCode)
          .maybeSingle(), // Use maybeSingle() instead of single() to handle empty results for new users
        
        supabase
          .from('v_realtime_group_stats')
          .select('*')
          .eq('user_code', userCode),
        
        supabase
          .from('v_realtime_daily_stats')
          .select('*')
          .eq('user_code', userCode)
          .order('date', { ascending: false })
          .limit(90),
        
        // Query analytics_clicks directly with date filter and optional contact filter
        (async () => {
          let query = supabase
            .from('analytics_clicks')
            .select('user_code, share_code, click_target, click_category, clicked_at, contact_id, session_id')
            .eq('user_code', userCode)
            .gte('clicked_at', startDate.toISOString())
            .order('clicked_at', { ascending: false });
          
          if (contactFilter) {
            query = query.eq('contact_id', contactFilter);
          }
          
          return query;
        })(),
        
        // Query analytics_page_views directly with date filter and optional contact filter
        (async () => {
          let query = supabase
            .from('analytics_page_views')
            .select('user_code, share_code, page_type, viewed_at, contact_id, session_id')
            .eq('user_code', userCode)
            .gte('viewed_at', startDate.toISOString())
            .order('viewed_at', { ascending: false });
          
          if (contactFilter) {
            query = query.eq('contact_id', contactFilter);
          }
          
          return query;
        })()
      ]);

      // Check for errors (but allow null data for new users)
      if (userStats.error && userStats.error.code !== 'PGRST116') throw userStats.error; // PGRST116 = no rows found
      if (groupStats.error) throw groupStats.error;
      if (dailyStats.error) throw dailyStats.error;
      if (clickTargets.error) throw clickTargets.error;
      if (pageStats.error) throw pageStats.error;

      // Aggregate click targets manually
      const clickTargetMap = new Map<string, { user_code: string; share_code: string; click_target: string; click_category: string; total_clicks: number }>();
      
      (clickTargets.data || []).forEach((click: any) => {
        const key = `${click.share_code}_${click.click_target}`;
        if (!clickTargetMap.has(key)) {
          clickTargetMap.set(key, {
            user_code: click.user_code,
            share_code: click.share_code,
            click_target: click.click_target,
            click_category: click.click_category,
            total_clicks: 0
          });
        }
        clickTargetMap.get(key)!.total_clicks++;
      });

      const aggregatedClickTargets = Array.from(clickTargetMap.values())
        .sort((a, b) => b.total_clicks - a.total_clicks);

      // Aggregate page stats manually (similar to click targets)
      const pageStatsMap = new Map<string, { user_code: string; share_code: string; page_type: string; total_views: number }>();
      
      (pageStats.data || []).forEach((page: any) => {
        const key = `${page.share_code}_${page.page_type}`;
        if (!pageStatsMap.has(key)) {
          pageStatsMap.set(key, {
            user_code: page.user_code,
            share_code: page.share_code,
            page_type: page.page_type,
            total_views: 0
          });
        }
        pageStatsMap.get(key)!.total_views++;
      });

      const aggregatedPageStats = Array.from(pageStatsMap.values())
        .sort((a, b) => b.total_views - a.total_views);

      return {
        user: userStats.data || { 
          total_sessions: 0, 
          total_page_views: 0, 
          total_clicks: 0,
          unique_visitors: 0 
        },
        groups: groupStats.data || [],
        daily: dailyStats.data || [],
        clickTargets: aggregatedClickTargets,
        pageStats: aggregatedPageStats,
        // Include raw data for session counting
        rawClicks: clickTargets.data || [],
        rawPageViews: pageStats.data || []
      };
    },

    /**
     * Get engaged contacts summary (PROTECTED - owner only)
     * Returns list of contacts who have interacted with the business card
     */
    getEngagedContacts: async (userCode: string, filters?: {
      shareCode?: string;
      minClicks?: number;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const user = await getCurrentUser();
      
      // Verify ownership
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden');
      }

      // Query the view
      let query = supabase
        .from('v_engaged_contacts_summary')
        .select('*')
        .eq('user_code', userCode);

      // Apply filters
      if (filters?.shareCode) {
        query = query.eq('share_code', filters.shareCode);
      }
      if (filters?.minClicks) {
        query = query.gte('total_clicks', filters.minClicks);
      }

      const { data, error } = await query.order('last_visit', { ascending: false });

      if (error) {
        console.error('Error fetching engaged contacts:', error);
        throw error;
      }

      return data || [];
    },

    /**
     * Get contact engagement timeline (PROTECTED - owner only)
     * Returns day-by-day engagement for a specific contact
     */
    getContactTimeline: async (userCode: string, contactCode: string) => {
      const user = await getCurrentUser();
      
      // Verify ownership
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden');
      }

      const { data, error } = await supabase
        .from('v_contact_engagement_timeline')
        .select('*')
        .eq('user_code', userCode)
        .eq('contact_code', contactCode)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching contact timeline:', error);
        throw error;
      }

      return data || [];
    },

    /**
     * Get engaged contacts count (PROTECTED - owner only)
     * Returns simple count of unique contacts who have engaged
     */
    getEngagedContactsCount: async (userCode: string, filters?: {
      shareCode?: string;
      minClicks?: number;
    }) => {
      const user = await getCurrentUser();
      
      // Verify ownership
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden');
      }

      // Build query
      let query = supabase
        .from('analytics_daily_contact_stats')
        .select('contact_code', { count: 'exact', head: false })
        .eq('user_code', userCode);

      if (filters?.shareCode) {
        query = query.eq('share_code', filters.shareCode);
      }
      if (filters?.minClicks) {
        query = query.gte('total_clicks', filters.minClicks);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error counting engaged contacts:', error);
        return 0;
      }

      // Count unique contact codes
      const uniqueContacts = new Set(data?.map((d: any) => d.contact_code) || []);
      return uniqueContacts.size;
    },

    /**
     * Run daily analytics aggregation (PROTECTED - owner only)
     * This is typically run by a cron job, but can be manually triggered
     */
    aggregateDaily: async (targetDate?: string) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Call the RPC function
      const { data, error } = await supabase.rpc(
        'aggregate_analytics_daily_with_contacts',
        { target_date: targetDate || new Date().toISOString().split('T')[0] }
      );

      if (error) {
        console.error('Error running daily aggregation:', error);
        throw error;
      }

      return data;
    },
  },

  // ============================================
  // AUTH API
  // ============================================

  auth: {
    /**
     * Sign up a new user (client-side with database trigger)
     * The database trigger automatically creates user code and business card
     */
    signup: async (email: string, password: string, name: string) => {
      console.log('[signup] Starting signup process...');
      
      // Build redirect URL for email confirmation
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('[signup] Email confirmation redirect URL:', redirectUrl);
      
      // Create user with Supabase auth
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      console.log('[signup] signUp response:', { 
        data: signupData, 
        error: signupError,
        user: signupData?.user,
        session: signupData?.session,
        identities: signupData?.user?.identities,
        email: signupData?.user?.email,
        emailConfirmed: signupData?.user?.email_confirmed_at
      });

      if (signupError) {
        console.error('[signup] Signup error:', signupError);
        throw signupError;
      }

      if (!signupData.user) {
        console.error('[signup] No user returned from signUp');
        throw new Error('Signup failed - no user returned');
      }

      const userId = signupData.user.id;
      console.log('[signup] User created successfully:', userId);
      console.log('[signup] User email confirmed?', signupData.user.email_confirmed_at ? 'YES' : 'NO');
      console.log('[signup] User identities:', signupData.user.identities);

      // Check if email confirmation is required
      // When email confirmation is enabled, identities array is empty until confirmed
      const needsEmailConfirmation = !signupData.user.identities || signupData.user.identities.length === 0;
      
      if (needsEmailConfirmation) {
        console.log('[signup] Email confirmation required. User must verify email before proceeding.');
        console.log('[signup] Confirmation email should have been sent to:', signupData.user.email);
        console.log('[signup] Check Supabase Dashboard > Authentication > Logs for email delivery status');
        return { 
          user: signupData.user, 
          userCode: null,
          needsEmailConfirmation: true 
        };
      }

      console.log('[signup] Calling initialize_user_data...');

      // Initialize user data via RPC function (no trigger)
      const { data: initData, error: initError } = await supabase
        .rpc('initialize_user_data', { p_user_id: userId });

      console.log('[signup] initialize_user_data response:', { data: initData, error: initError });

      if (initError || !initData?.success) {
        console.error('[signup] Failed to initialize user data:', initError || initData);
        throw new Error('Account created but setup incomplete. Please contact support.');
      }

      console.log('[signup] Signup complete! User code:', initData.user_code);

      return { 
        user: signupData.user, 
        userCode: initData.user_code,
        needsEmailConfirmation: false 
      };
    },

    /**
     * Send password reset email
     */
    forgotPassword: async (email: string) => {
      console.log('[forgotPassword] Sending password reset email to:', email);
      
      // Use absolute URL - Supabase requires exact match with whitelisted URLs
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      console.log('[forgotPassword] Redirect URL:', redirectUrl);
      console.log('[forgotPassword] Current origin:', window.location.origin);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
        emailRedirectTo: redirectUrl, // Some Supabase versions need this too
      });

      if (error) {
        console.error('[forgotPassword] Error:', error);
        console.error('[forgotPassword] Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        // Provide more helpful error messages
        if (error.message?.includes('redirect') || error.message?.includes('URL')) {
          throw new Error('Password reset URL not configured. Please contact support.');
        }
        
        throw error;
      }

      console.log('[forgotPassword] Password reset email sent successfully');
      return { success: true };
    },

    /**
     * Reset password with token from email
     */
    resetPassword: async (newPassword: string) => {
      console.log('[resetPassword] Resetting password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('[resetPassword] Error:', error);
        throw error;
      }

      console.log('[resetPassword] Password reset successfully');
      return { success: true };
    },
  },

  // ============================================
  // STORAGE API
  // ============================================

  storage: {
    /**
     * Upload a file to Supabase Storage (PROTECTED)
     */
    upload: async (userCode: string, file: File) => {
      const user = await getCurrentUser();
      
      // Verify ownership
      const isOwner = await verifyOrClaimOwnership(userCode, user.id);
      if (!isOwner) {
        throw new Error('Forbidden');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userCode}/${timestamp}-${crypto.randomUUID()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-assets')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-assets')
        .getPublicUrl(fileName);

      return { url: publicUrl };
    },
  },

  // ============================================
  // PORTRAIT TEMPLATES API
  // ============================================

  templates: {
    /**
     * Get portrait style templates from external API
     */
    get: async (userCode: string) => {
      try {
        const response = await fetch('https://portrait-generator-568865197474.europe-west1.run.app/templates');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.statusText}`);
        }

        const data = await response.json();
        return { templates: data.templates || [] };
      } catch (error: any) {
        console.error('Error fetching templates:', error);
        throw new Error(`Failed to load templates: ${error.message}`);
      }
    },
  },

  // ============================================
  // QUOTA API
  // ============================================

  quota: {
    /**
     * Check if user can use a feature based on quota limits
     */
    check: async (userId: string, featureName: string) => {
      try {
        const { data, error } = await supabase.rpc('check_user_quota', {
          p_user_id: userId,
          p_feature_name: featureName
        });

        if (error) {
          console.error('Quota check error:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          throw new Error('No quota data returned');
        }

        const quotaData = data[0];
        return {
          allowed: quotaData.can_use,
          planName: quotaData.plan_name,
          hourlyUsed: quotaData.hourly_used,
          hourlyLimit: quotaData.hourly_limit,
          monthlyUsed: quotaData.monthly_used,
          monthlyLimit: quotaData.monthly_limit,
          hourlyRemaining: quotaData.hourly_remaining,
          monthlyRemaining: quotaData.monthly_remaining,
          hourlyResetAt: quotaData.hourly_reset_at,
          monthlyResetAt: quotaData.monthly_reset_at
        };
      } catch (error: any) {
        console.error('Error checking quota:', error);
        throw new Error(`Failed to check quota: ${error.message}`);
      }
    },

    /**
     * Log feature usage after successful generation
     */
    logUsage: async (userId: string, featureName: string) => {
      try {
        const { error } = await supabase
          .from('usage_logs')
          .insert({
            user_id: userId,
            feature_name: featureName
          });

        if (error) {
          console.error('Usage logging error:', error);
          throw error;
        }
      } catch (error: any) {
        console.error('Error logging usage:', error);
        // Don't throw - usage logging failure shouldn't block the feature
      }
    }
  },

  // ============================================
  // BUSINESS MANAGEMENT API
  // ============================================

  business: {
    /**
     * Check if current user is a business owner
     */
    isBusinessOwner: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('is_business_owner');
      if (error) {
        console.error('Error checking business owner status:', error);
        return false;
      }
      return data ?? false;
    },

    /**
     * Check if current user is an employee
     */
    isEmployee: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('is_employee');
      if (error) {
        console.error('Error checking employee status:', error);
        return false;
      }
      return data ?? false;
    },

    /**
     * Get all employees for the current business owner
     */
    getEmployees: async (): Promise<EmployeeWithDetails[]> => {
      const { data, error } = await supabase.rpc('get_business_employees');
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      return data ?? [];
    },

    /**
     * Get business owner info for current employee
     */
    getBusinessOwner: async (): Promise<BusinessOwnerInfo | null> => {
      const { data, error } = await supabase.rpc('get_employee_business_owner');
      if (error) {
        console.error('Error fetching business owner:', error);
        throw error;
      }
      return data?.[0] ?? null;
    },

    /**
     * Create employee account (for business owner)
     * Flow: Save business owner session -> Create employee -> Restore business owner session -> Link employee
     */
    createEmployee: async (params: {
      email: string;
      password: string;
      name: string;
      employeeCode?: string;
      role?: string;
      department?: string;
      fieldPermissions?: Record<string, FieldPermissionLevel>;
    }): Promise<{ userCode: string; employeeUserId: string }> => {
      // 1. Save business owner's session BEFORE signup (signup will change auth context)
      const { data: { session: businessOwnerSession } } = await supabase.auth.getSession();
      if (!businessOwnerSession) throw new Error('Not authenticated as business owner');
      
      const businessOwnerUserId = businessOwnerSession.user.id;
      console.log('[createEmployee] Business owner ID:', businessOwnerUserId);
      
      // 2. Create employee account via signup
      // Note: This changes the auth context to the new employee!
      const signupResponse = await api.auth.signup(
        params.email, 
        params.password, 
        params.name
      );
      
      const employeeUserId = signupResponse.user.id;
      const employeeUserCode = signupResponse.userCode;
      console.log('[createEmployee] Employee created:', employeeUserId, employeeUserCode);
      
      // 3. Restore business owner's session
      console.log('[createEmployee] Restoring business owner session...');
      const { error: restoreError } = await supabase.auth.setSession({
        access_token: businessOwnerSession.access_token,
        refresh_token: businessOwnerSession.refresh_token,
      });
      
      if (restoreError) {
        console.error('Error restoring business owner session:', restoreError);
        throw new Error('Failed to restore business owner session');
      }
      
      console.log('[createEmployee] Business owner session restored');
      
      // 4. Get business owner's business card data to populate employee's card
      let businessOwnerBusinessName = '';
      try {
        const businessOwnerUserCode = await supabase
          .from('user_code_ownership')
          .select('user_code')
          .eq('user_id', businessOwnerUserId)
          .maybeSingle();
        
        if (businessOwnerUserCode.data?.user_code) {
          const businessOwnerCard = await api.card.get(businessOwnerUserCode.data.user_code);
          if (businessOwnerCard) {
            businessOwnerBusinessName = businessOwnerCard.personal.businessName || '';
          }
        }
      } catch (error) {
        console.warn('[createEmployee] Could not load business owner card data:', error);
        // Continue anyway - not critical
      }
      
      // 5. Now as business owner, insert into business_management (RLS will pass)
      // Set default permissions to 'readonly' for Company Name and Professional Title
      const defaultPermissions: Record<string, FieldPermissionLevel> = {
        'personal.businessName': 'readonly',
        'personal.title': 'readonly',
        ...(params.fieldPermissions || {}),
      };
      
      const { error: bmError } = await supabase
        .from('business_management')
        .insert({
          business_owner_user_id: businessOwnerUserId,
          employee_user_id: employeeUserId,
          employee_code: params.employeeCode || null,
          role: params.role || null,
          department: params.department || null,
          field_permissions: defaultPermissions,
        });
      
      if (bmError) {
        console.error('Error creating business management record:', bmError);
        throw bmError;
      }
      
      console.log('[createEmployee] Business management record created');
      
      // 6. Set employee's plan to 'employee' using RPC function (bypasses RLS)
      const { data: planResult, error: planError } = await supabase
        .rpc('set_employee_plan', {
          p_employee_user_id: employeeUserId,
          p_business_owner_user_id: businessOwnerUserId,
        });
      
      if (planError) {
        console.error('Error setting employee plan:', planError);
        // Don't throw - employee is created, plan update is secondary
        // But log it for debugging
      } else {
        console.log('[createEmployee] Employee plan set to "employee"');
      }
      
      // 7. Update employee's business card with business owner's business name and employee's role as title
      if (businessOwnerBusinessName || params.role) {
        try {
          // Get current employee card
          const employeeCard = await api.card.get(employeeUserCode);
          if (employeeCard) {
            // Update with business owner's business name and employee's role (from business_management) as title
            const updatedCard = {
              ...employeeCard,
              personal: {
                ...employeeCard.personal,
                businessName: businessOwnerBusinessName || employeeCard.personal.businessName,
                title: params.role || employeeCard.personal.title, // Use role from business_management, not business owner's title
              },
            };
            
            // Update employee card (as business owner, we can update it)
            await api.business.updateEmployeeCard(employeeUserCode, updatedCard);
            console.log('[createEmployee] Employee business card updated with business name and role as title');
          }
        } catch (error) {
          console.warn('[createEmployee] Could not update employee business card:', error);
          // Don't throw - card update is secondary, employee is already created
        }
      }
      
      return { 
        userCode: employeeUserCode, 
        employeeUserId 
      };
    },

    /**
     * Update employee details
     */
    updateEmployee: async (
      employeeUserId: string,
      updates: {
        employeeCode?: string;
        role?: string;
        department?: string;
        isActive?: boolean;
        fieldPermissions?: Record<string, FieldPermissionLevel>;
      }
    ): Promise<void> => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      
      if (updates.employeeCode !== undefined) updateData.employee_code = updates.employeeCode;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.department !== undefined) updateData.department = updates.department;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.fieldPermissions !== undefined) updateData.field_permissions = updates.fieldPermissions;
      
      const { error } = await supabase
        .from('business_management')
        .update(updateData)
        .eq('employee_user_id', employeeUserId);
      
      if (error) {
        console.error('Error updating employee:', error);
        throw error;
      }
    },

    /**
     * Activate/Deactivate employee
     */
    setEmployeeActive: async (employeeUserId: string, isActive: boolean): Promise<void> => {
      const { error } = await supabase
        .from('business_management')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('employee_user_id', employeeUserId);
      
      if (error) {
        console.error('Error updating employee status:', error);
        throw error;
      }
    },

    /**
     * Update field permissions for an employee
     * Note: Only company fields (personal.businessName, personal.title) can be restricted.
     * All other fields are always editable by employees.
     */
    updateFieldPermissions: async (
      employeeUserId: string,
      fieldPermissions: Record<string, FieldPermissionLevel>
    ): Promise<void> => {
      // Only allow permissions for company fields
      const COMPANY_FIELDS = ['personal.businessName', 'personal.title'];
      const filteredPermissions: Record<string, FieldPermissionLevel> = {};
      
      for (const [fieldPath, permission] of Object.entries(fieldPermissions)) {
        if (COMPANY_FIELDS.includes(fieldPath)) {
          filteredPermissions[fieldPath] = permission;
        }
      }
      
      // Ensure we're updating the database with the filtered permissions
      // If filteredPermissions is empty (all fields editable), set to empty object
      const { error, data } = await supabase
        .from('business_management')
        .update({ 
          field_permissions: filteredPermissions, 
          updated_at: new Date().toISOString() 
        })
        .eq('employee_user_id', employeeUserId)
        .select();
      
      if (error) {
        console.error('Error updating field permissions:', error);
        throw error;
      }
      
      // Log successful update for debugging
      console.log(`[updateFieldPermissions] Updated permissions for employee ${employeeUserId}:`, filteredPermissions);
    },

    /**
     * Get field permissions for current employee
     */
    getMyFieldPermissions: async (): Promise<Record<string, FieldPermissionLevel>> => {
      const { data, error } = await supabase.rpc('get_employee_field_permissions');
      if (error) {
        console.error('Error fetching field permissions:', error);
        return {};
      }
      return data ?? {};
    },

    /**
     * Check if current employee can edit a specific field
     */
    canEditField: async (fieldPath: string): Promise<boolean> => {
      const { data, error } = await supabase.rpc('can_employee_edit_field', {
        p_field_path: fieldPath
      });
      if (error) {
        console.error('Error checking field permission:', error);
        return true; // Default to allowing
      }
      return data ?? true;
    },

    /**
     * Get employee's business card (for business owner to edit)
     */
    getEmployeeCard: async (employeeUserCode: string): Promise<BusinessCardData | null> => {
      return api.card.get(employeeUserCode);
    },

    /**
     * Update employee's business card (for business owner)
     * Bypasses ownership check - relies on RLS policies to ensure only business owners can update
     */
    updateEmployeeCard: async (employeeUserCode: string, data: BusinessCardData): Promise<void> => {
      // Get employee's user_id from business_cards table (we can read this via RLS policy)
      const { data: cardData, error: cardReadError } = await supabase
        .from('business_cards')
        .select('user_id, logo_url')
        .eq('user_code', employeeUserCode)
        .maybeSingle();
      
      if (cardReadError) {
        console.error('Error fetching employee card:', cardReadError);
        throw new Error(`Failed to find employee card: ${cardReadError.message}`);
      }
      
      if (!cardData) {
        throw new Error(`Employee card with user code ${employeeUserCode} not found`);
      }
      
      const employeeUserId = cardData.user_id;
      
      // ✅ CRITICAL FIX: Preserve existing logo_url if not explicitly provided
      // Logo should only be updated when explicitly uploaded, not during auto-save
      let preservedLogoUrl: string | null = null;
      const dataLogoUrl = (data as any).logo_url;
      if (dataLogoUrl === undefined || dataLogoUrl === null) {
        preservedLogoUrl = cardData.logo_url || null;
      }
      
      // Transform to database format using employee's user_id
      const dbCard = businessCardToDb(data, employeeUserId, employeeUserCode);
      
      // Use preserved logo_url if data doesn't have one
      const logoUrlToSave = dataLogoUrl !== undefined && dataLogoUrl !== null 
        ? dbCard.logo_url 
        : preservedLogoUrl;
      
      // Update business card directly (RLS will enforce business owner permissions)
      const { error: cardError } = await supabase
        .from('business_cards')
        .update({
          name: dbCard.name,
          title: dbCard.title,
          company_name: dbCard.company_name,
          bio: dbCard.bio,
          email: dbCard.email,
          phone: dbCard.phone,
          website_url: dbCard.website_url,
          avatar_url: dbCard.avatar_url,
          background_image_url: dbCard.background_image_url,
          logo_url: logoUrlToSave,
          linkedin_url: dbCard.linkedin_url,
          twitter_url: dbCard.twitter_url,
          instagram_url: dbCard.instagram_url,
          facebook_url: dbCard.facebook_url,
          portfolio_images: dbCard.portfolio_images,
          custom_fields: dbCard.custom_fields,
        })
        .eq('user_code', employeeUserCode);
      
      if (cardError) {
        console.error('Error updating employee business card:', cardError);
        throw new Error(`Failed to update employee card: ${cardError.message}`);
      }
      
      // Update share settings
      const dbSettings = shareSettingsToDb(data, employeeUserId, employeeUserCode);
      const { error: settingsError } = await supabase
        .from('share_settings')
        .update({
          hide_email: dbSettings.hide_email,
          hide_phone: dbSettings.hide_phone,
          hide_social: dbSettings.hide_social,
          hide_portfolio: dbSettings.hide_portfolio,
          custom_settings: dbSettings.custom_settings,
        })
        .eq('user_code', employeeUserCode);
      
      if (settingsError) {
        console.error('Error updating employee share settings:', settingsError);
        // Don't throw - share settings update failure shouldn't block card update
      }
    },

    /**
     * Remove employee from business (does not delete user account)
     */
    removeEmployee: async (employeeUserId: string): Promise<void> => {
      const { error } = await supabase
        .from('business_management')
        .delete()
        .eq('employee_user_id', employeeUserId);
      
      if (error) {
        console.error('Error removing employee:', error);
        throw error;
      }
      
      // Reset employee's plan to 'free'
      await supabase
        .from('user_plan')
        .update({ plan_name: 'free' })
        .eq('user_id', employeeUserId);
    },
  },
};