import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GroupShareSettings } from '../types/business-card';
import { CustomGroup, loadCustomGroups, saveCustomGroups as saveLocalCustomGroups, DEFAULT_GROUPS } from '../utils/custom-groups';
import { loadGroupShareSettings, saveGroupShareSettings as saveLocalGroupShareSettings, getDefaultGroupShareSettings } from '../utils/group-share-settings';
import { getUserCode } from '../utils/user-code';
import { api } from '../lib/api';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabase-client';
import { useMemo } from 'react';

const QUERY_KEY = 'settings';

export function useSettings(userCodeOverride?: string) {
  const queryClient = useQueryClient();
  const currentUserCode = getUserCode();
  const targetUserCode = userCodeOverride || currentUserCode;

  const query = useQuery({
    queryKey: [QUERY_KEY, targetUserCode],
    queryFn: async () => {
      // Fetch from API
      const data = await api.settings.get(targetUserCode);
      
      // strict mode: rely on server data or defaults
      return {
        settings: (data.settings && Object.keys(data.settings).length > 0) ? data.settings : getDefaultGroupShareSettings(),
        customGroups: (data.customGroups && data.customGroups.length > 0) ? data.customGroups : DEFAULT_GROUPS
      };
    },
    initialData: undefined // Remove optimistic local storage data to prevent hydration mismatches
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (variables: { settings?: GroupShareSettings, customGroups?: CustomGroup[] }) => {
      const { settings, customGroups } = variables;
      
      // Strict Mode: Ensure we are authenticated before saving
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Authentication required to save settings");
      }

      // Save to cloud
      // Note: We intentionally do NOT save to local storage here anymore.
      // We rely solely on Supabase as the source of truth.
      await api.settings.save(targetUserCode, settings, customGroups);
      
      return { settings, customGroups };
    },
    onSuccess: (data) => {
      // Update cache - only update defined fields to avoid overwriting with undefined
      queryClient.setQueryData([QUERY_KEY, targetUserCode], (old: any) => {
        const newData = { ...old };
        if (data.settings !== undefined) newData.settings = data.settings;
        if (data.customGroups !== undefined) newData.customGroups = data.customGroups;
        return newData;
      });
      // Invalidate to be sure
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, targetUserCode] });
      // toast.success("Settings saved"); // Toast is often handled by component
    },
    onError: (error) => {
      console.error('Failed to save settings:', error);
      toast.error("Failed to save settings to cloud");
    }
  });

  // Memoize return value to ensure stable references and prevent infinite loops in consumers
  return useMemo(() => ({
    settings: query.data?.settings || {},
    customGroups: query.data?.customGroups || [],
    isLoading: query.isLoading,
    saveSettings: (settings: GroupShareSettings) => saveSettingsMutation.mutateAsync({ 
      settings, 
      customGroups: query.data?.customGroups // ✅ Pass current groups so API can lookup share codes
    }),
    saveGroups: (customGroups: CustomGroup[]) => saveSettingsMutation.mutateAsync({ customGroups }),
    saveAll: (settings: GroupShareSettings, customGroups: CustomGroup[]) => saveSettingsMutation.mutateAsync({ settings, customGroups }),
    isSaving: saveSettingsMutation.isPending
  }), [query.data, query.isLoading, saveSettingsMutation]);
}