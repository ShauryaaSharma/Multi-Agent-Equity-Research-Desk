'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/httpClient';
import { djangoOrigin } from '@/lib/originResolver';

export function useServiceHealth() {
  const query = useQuery({
    queryKey: ['api-health'],
    queryFn: () => apiClient.checkHealth(),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 6,
    retryDelay: (attempt) => Math.min(30000, 5000 * (attempt + 1)),
  });

  return {
    isConnected: query.data?.ok === true,
    message: query.data?.message,
    backendUrl: djangoOrigin(),
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
