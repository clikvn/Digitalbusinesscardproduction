import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getUserCode } from '../utils/user-code';
import { toast } from 'sonner@2.0.3';

/**
 * Hook for managing field visibility across groups (used in CMS)
 */
export function useFieldVisibility() {
  const queryClient = useQueryClient();
  const userCode = getUserCode();
  
  // Fetch settings and groups
  const query = useQuery({
    queryKey: ['visibilitySettings', userCode],
    queryFn: async () => {
      return api.settings.get(userCode);
    }
  });

  const { settings = {}, customGroups = [] } = query.data || {};

  const mutation = useMutation({
    mutationFn: async (newSettings: any) => {
      return api.settings.save(userCode, newSettings, customGroups);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visibilitySettings', userCode] });
      // Also invalidate public card so previews update
      queryClient.invalidateQueries({ queryKey: ['publicBusinessCard'] });
      
      // Dispatch event for local updates (legacy support)
      window.dispatchEvent(new CustomEvent('groupShareSettingsChanged'));
    },
    onError: () => {
      toast.error('Failed to save visibility settings');
    }
  });

  const isFieldVisible = (fieldPath: string, groupId: string): boolean => {
    return settings[groupId]?.includes(fieldPath) || false;
  };

  const toggleField = (fieldPath: string, groupId: string) => {
    const groupFields = [...(settings[groupId] || [])];
    const index = groupFields.indexOf(fieldPath);
    
    if (index > -1) {
      groupFields.splice(index, 1);
    } else {
      groupFields.push(fieldPath);
    }
    
    const newSettings = {
      ...settings,
      [groupId]: groupFields,
    };
    
    // Optimistically update? No, let's just mutate.
    mutation.mutate(newSettings);
  };

  return { 
    groups: customGroups, 
    isFieldVisible, 
    toggleField,
    isLoading: query.isLoading
  };
}
