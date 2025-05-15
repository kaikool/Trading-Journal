/**
 * Hook React Query để quản lý dữ liệu người dùng
 * Thay thế hoàn toàn cho useDataCache.userData
 */

import { useQuery } from "@tanstack/react-query";
import { auth, getUserData } from "@/lib/firebase";
import { debug } from "@/lib/debug";

export function useUserDataQuery() {
  const userId = auth.currentUser?.uid;

  const query = useQuery({
    queryKey: ['userData', userId],
    queryFn: async () => {
      if (!userId) return null;
      debug(`Fetching user data for ${userId}`);
      return await getUserData(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000,   // 10 phút
    refetchOnWindowFocus: false,
  });

  return {
    userData: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    userId,
  };
}