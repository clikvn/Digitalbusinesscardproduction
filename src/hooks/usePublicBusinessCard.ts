import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { filterBusinessCardData } from '../utils/filtered-data-loader';
import { defaultBusinessCardData, emptyBusinessCardData } from '../types/business-card';
import { ContactGroup } from '../types/contacts';
import { getDefaultGroupShareSettings } from '../utils/group-share-settings';
import { DEFAULT_GROUPS } from '../utils/custom-groups';
import { supabase } from '../lib/supabase-client';
import { getUserCode } from '../utils/user-code';

/**
 * Hook to fetch and filter business card data for public viewing
 * 
 * Features:
 * - Authenticated users viewing their own profile see ALL data (no filtering)
 * - Public/anonymous users see filtered data based on group settings
 * - Supports custom groups from database via share codes
 * - Falls back to default groups if none exist
 */
export function usePublicBusinessCard(userCode: string, groupCodeOrId?: string) {
  const query = useQuery({
    queryKey: ['publicBusinessCard', userCode, groupCodeOrId],
    queryFn: async () => {
      console.log('[usePublicBusinessCard] Fetching for:', { userCode, groupCodeOrId });
      
      // ============================================
      // 1. Check Authentication
      // ============================================
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserCode = session ? getUserCode() : null;
      const isViewingOwnProfile = currentUserCode === userCode;
      
      // ============================================
      // 2. Fetch Data and Settings in Parallel
      // ============================================
      const [rawData, settingsData] = await Promise.all([
        api.card.get(userCode),
        api.settings.get(userCode)
      ]);

      const data = rawData;
      const { settings, customGroups } = settingsData;
      
      console.log('[usePublicBusinessCard] Data fetched:', {
        hasData: !!data,
        hasSettings: !!settings && Object.keys(settings).length > 0,
        groupsCount: customGroups?.length || 0,
        settingsGroupIds: settings ? Object.keys(settings) : []
      });
      
      // Log actual data values for debugging
      if (data) {
        console.log('[usePublicBusinessCard] Raw data sample:', {
          name: data.personal.name,
          title: data.personal.title,
          email: data.contact.email,
          phone: data.contact.phone,
          about: data.profile.about?.substring(0, 50) + '...',
          experience: data.profile.experience?.substring(0, 50) + '...',
          languages: data.profile.languages,
          certifications: data.profile.certifications
        });
      }
      
      // ============================================
      // 3. Handle Missing Data
      // ============================================
      if (!data) {
        // Return demo data for "myclik", empty data for others
        return userCode === 'myclik' ? defaultBusinessCardData : emptyBusinessCardData;
      }

      // ============================================
      // 4. Use Defaults if Settings/Groups Missing
      // ============================================
      const effectiveSettings = (!settings || Object.keys(settings).length === 0) 
        ? getDefaultGroupShareSettings() 
        : settings;
        
      const effectiveGroups = (!customGroups || customGroups.length === 0)
        ? DEFAULT_GROUPS
        : customGroups;

      // ============================================
      // 5. Owner Bypass - Show All Data
      // ============================================
      if (isViewingOwnProfile) {
        console.log('[usePublicBusinessCard] Owner viewing own profile - bypassing filters');
        return data;
      }

      // ============================================
      // 6. Resolve Group ID
      // ============================================
      let groupId: ContactGroup | null = null;

      if (groupCodeOrId) {
        // Try to match by share code or group ID in custom groups
        const found = effectiveGroups.find((g: any) => 
          g.id === groupCodeOrId || g.shareCode === groupCodeOrId
        );
        
        if (found) {
          groupId = found.id;
          console.log('[usePublicBusinessCard] Matched custom group:', { shareCode: groupCodeOrId, groupId });
        } else if (['public', 'private', 'business', 'personal'].includes(groupCodeOrId)) {
          // Standard group ID
          groupId = groupCodeOrId as ContactGroup;
          console.log('[usePublicBusinessCard] Using standard group:', groupId);
        } else {
          // Unknown code - default to public
          groupId = 'public';
          console.warn('[usePublicBusinessCard] Unknown group code, defaulting to public:', groupCodeOrId);
        }
      } else {
        // No group code - default to public
        // Try to find 'public' by various methods:
        // 1. By ID (e.g., 'public' from DEFAULT_GROUPS)
        // 2. By shareCode (e.g., 'PUBLIC')
        // 3. By label (e.g., 'Public')
        // 4. Fallback to first available group
        
        let publicGroup = effectiveGroups.find((g: any) => g.id === 'public');
        
        if (!publicGroup) {
          publicGroup = effectiveGroups.find((g: any) => 
            g.shareCode?.toUpperCase() === 'PUBLIC'
          );
        }
        
        if (!publicGroup) {
          publicGroup = effectiveGroups.find((g: any) => 
            g.label?.toLowerCase() === 'public'
          );
        }
        
        if (publicGroup) {
          groupId = publicGroup.id;
          console.log('[usePublicBusinessCard] Found public group:', groupId);
        } else if (effectiveGroups.length > 0) {
          groupId = effectiveGroups[0].id;
          console.log('[usePublicBusinessCard] No public group, using first available:', groupId);
        } else {
          groupId = 'public'; // Ultimate fallback
          console.warn('[usePublicBusinessCard] No groups found, using hardcoded public');
        }
      }

      // ============================================
      // 7. Apply Filtering
      // ============================================
      console.log('[usePublicBusinessCard] Applying filter:', {
        groupId,
        hasSettingsForGroup: !!effectiveSettings[groupId],
        visibleFieldsCount: effectiveSettings[groupId]?.length || 0
      });
      
      const filteredData = filterBusinessCardData(data, effectiveSettings, groupId);
      
      console.log('[usePublicBusinessCard] Filtering complete:', {
        name: filteredData.personal.name || '(hidden)',
        title: filteredData.personal.title || '(hidden)',
        email: filteredData.contact.email || '(hidden)',
        phone: filteredData.contact.phone || '(hidden)',
        about: filteredData.profile.about ? filteredData.profile.about.substring(0, 50) + '...' : '(hidden)',
        experience: filteredData.profile.experience ? filteredData.profile.experience.substring(0, 50) + '...' : '(hidden)',
        languages: filteredData.profile.languages || '(hidden)',
        certifications: filteredData.profile.certifications || '(hidden)'
      });
      
      return filteredData;
    },
    staleTime: 1000 * 10, // 10 seconds
    refetchOnWindowFocus: true,
  });

  return query;
}