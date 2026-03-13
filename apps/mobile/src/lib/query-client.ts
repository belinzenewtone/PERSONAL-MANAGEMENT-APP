import { QueryClient } from '@tanstack/react-query';
import { isNetworkError } from './error-handler';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:             1000 * 60 * 5,   // 5 min — serve cache before refetching
      gcTime:                1000 * 60 * 30,  // 30 min — keep data in memory for offline
      retry: (failureCount, error) => {
        // Don't retry auth or validation errors
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('unauthenticated') || msg.includes('jwt') || msg.includes('403')) return false;
        }
        // Retry network errors up to 3 times
        if (isNetworkError(error)) return failureCount < 3;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // exponential back-off, max 10s
      refetchOnWindowFocus:      false,
      refetchOnReconnect:        true,   // auto-refetch when back online
      refetchOnMount:            true,
      networkMode:               'offlineFirst', // serve cache immediately when offline
    },
    mutations: {
      retry: (failureCount, error) => {
        if (isNetworkError(error)) return failureCount < 2;
        return false; // don't retry non-network mutation failures
      },
      retryDelay: 2000,
      networkMode: 'offlineFirst',
    },
  },
});
