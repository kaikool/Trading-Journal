
import { useQuery } from '@tanstack/react-query';
import { getStrategies } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { TradingStrategy } from '@/types';
import { logError } from '@/lib/debug';

/**
 * Custom hook to fetch and cache the user's trading strategies.
 * This hook handles fetching the data once and making it available
 * to any component that needs it, avoiding redundant Firestore reads.
 */
export const useStrategies = () => {
  const { userId } = useAuth();

  return useQuery<TradingStrategy[], Error>({ // Explicitly type the expected data and error
    queryKey: ['strategies', userId], // The key for caching the query
    queryFn: async () => {
      if (!userId) {
        // This should not happen if `enabled` is set correctly, but it's a good safeguard.
        return [];
      }
      try {
        // The getStrategies function already fetches all strategies for the user.
        const strategies = await getStrategies(userId);
        return strategies;
      } catch (error) {
        logError("useStrategies: Error fetching strategies", error);
        // Re-throw the error to let react-query handle the error state
        throw error;
      }
    },
    // Options for the query
    enabled: !!userId, // Only run the query if the userId is available
    staleTime: 1000 * 60 * 5, // Consider the data fresh for 5 minutes
    refetchOnWindowFocus: false, // Optional: useful for data that doesn't change often
    placeholderData: [], // Start with an empty array to prevent issues on initial render
  });
};
