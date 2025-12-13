import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase-client';

interface UserPlan {
  plan_name: string;
  display_name?: string;
}

export function useUserPlan(userId?: string) {
  return useQuery({
    queryKey: ['user-plan', userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      // Get user's plan WITHOUT join to avoid RLS recursion
      const { data: userPlanData, error: userPlanError } = await supabase
        .from('user_plan')
        .select('plan_name')
        .eq('user_id', userId)
        .single();

      if (userPlanError) {
        console.error('Error fetching user plan:', userPlanError);
        return null;
      }

      if (!userPlanData) {
        return null;
      }

      // Fetch plan details separately (no RLS on plans table)
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('display_name')
        .eq('plan_name', userPlanData.plan_name)
        .single();

      if (planError) {
        console.error('Error fetching plan details:', planError);
        // Return with plan_name as fallback
        return {
          plan_name: userPlanData.plan_name,
          display_name: userPlanData.plan_name,
        };
      }

      return {
        plan_name: userPlanData.plan_name,
        display_name: planData.display_name,
      } as UserPlan;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}