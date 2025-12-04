import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessCardData, defaultBusinessCardData, emptyBusinessCardData } from '../types/business-card';
import { getUserCode } from '../utils/user-code';
import { toast } from 'sonner@2.0.3';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase-client';

const QUERY_KEY = 'businessCard';

/**
 * Get appropriate default data based on user code
 * - "myclik" gets demo data (Christine Nguyen)
 * - New users get empty fields with their name from registration
 */
async function getDefaultDataForUser(userCode: string): Promise<BusinessCardData> {
  // "myclik" is the demo account - use static demo data
  if (userCode === 'myclik') {
    return defaultBusinessCardData;
  }
  
  // For all other users (new accounts), start with empty data
  // but pre-fill their name from auth metadata if available
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.name) {
      return {
        ...emptyBusinessCardData,
        personal: {
          ...emptyBusinessCardData.personal,
          name: user.user_metadata.name
        }
      };
    }
  } catch (error) {
    console.log('Could not fetch user metadata:', error);
  }
  
  return emptyBusinessCardData;
}

export function useBusinessCard(userCodeOverride?: string) {
  const queryClient = useQueryClient();
  const currentUserCode = getUserCode();
  const targetUserCode = userCodeOverride || currentUserCode;

  const query = useQuery({
    queryKey: [QUERY_KEY, targetUserCode],
    queryFn: async () => {
      // 1. Try API
      const cloudData = await api.card.get(targetUserCode);
      
      if (cloudData) {
        return cloudData;
      }
      
      // If no data in cloud, return appropriate default based on user code
      return await getDefaultDataForUser(targetUserCode);
    },
    // No initial data from local storage to ensure source of truth is Supabase
    initialDataUpdatedAt: 0, 
  });

  const mutation = useMutation({
    mutationFn: async (newData: BusinessCardData) => {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to save changes to the cloud.');
      }

      await api.card.save(targetUserCode, newData);
      return newData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEY, targetUserCode], data);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, targetUserCode] });
      toast.success('Saved to cloud');
    },
    onError: (error) => {
      console.error('Failed to save business card:', error);
      
      // ✅ No more validation errors since database accepts any text
      // Show error toast for actual save failures (network, auth, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      toast.error(errorMessage);
    },
  });

  return {
    // ✅ CRITICAL FIX: Don't fallback to defaultBusinessCardData!
    // Return undefined during loading to prevent auto-save from overwriting user data
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    update: mutation.mutate,
    updateAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}