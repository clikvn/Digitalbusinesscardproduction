import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getUserCode } from '../utils/user-code';
import { supabase } from '../lib/supabase-client';
import { Contact } from '../types/contacts';
import { toast } from 'sonner@2.0.3';

const QUERY_KEY = 'share_contacts';

/**
 * Hook for managing share contacts (individual tracked shares)
 * Each contact gets a unique URL: /user_code/group_code/contact_code
 * This allows tracking engagement per individual person
 */
export function useContacts(userCodeOverride?: string) {
  const queryClient = useQueryClient();
  const currentUserCode = getUserCode();
  const targetUserCode = userCodeOverride || currentUserCode;

  const query = useQuery({
    queryKey: [QUERY_KEY, targetUserCode],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return []; // Share contacts are private
      
      return api.shareContacts.get(targetUserCode);
    },
    // REMOVED: initialData: [] - This was preventing refetch on page load
    // Now React Query will always fetch on mount
  });

  const saveContactsMutation = useMutation({
    mutationFn: async (contacts: Contact[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Authentication required to save share contacts");
      }

      await api.shareContacts.save(targetUserCode, contacts);
      return contacts;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEY, targetUserCode], data);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, targetUserCode] });
    },
    onError: (error) => {
      console.error('Failed to save share contacts:', error);
      toast.error("Failed to save share contacts to cloud");
    }
  });

  return {
    contacts: query.data || [],
    isLoading: query.isLoading,
    saveContacts: (contacts: Contact[]) => saveContactsMutation.mutateAsync(contacts),
    isSaving: saveContactsMutation.isPending
  };
}