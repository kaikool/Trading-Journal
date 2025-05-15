/**
 * Hook React Query đơn giản cho dữ liệu người dùng
 * Thay thế hoàn toàn DataCacheContext với React Query
 */

import { useQuery } from "@tanstack/react-query";
import { getUserData } from "@/lib/firebase";
import { debug } from "@/lib/debug";
import { useAuth } from "./use-auth";

export function useUserDataQuery() {
  const { userId } = useAuth();
  
  const { data: userData, isLoading, error } = useQuery({
    queryKey: [`/users/${userId}`],
    queryFn: async () => {
      if (!userId) return null;
      
      debug(`Fetching user data for ${userId}`);
      return await getUserData(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer than trades data
  });
  
  return {
    userData,
    isLoading,
    error,
  };
}