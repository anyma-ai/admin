import { useQuery } from '@tanstack/react-query';

import type { CustomerAnalyticsQuery } from '@/common/types';

import { getCustomerAnalytics } from './customersApi';

const customerKeys = {
  analytics: (params: CustomerAnalyticsQuery) =>
    ['analytics', 'customers', params] as const,
};

export function useCustomerAnalytics(params: CustomerAnalyticsQuery) {
  return useQuery({
    queryKey: customerKeys.analytics(params),
    queryFn: () => getCustomerAnalytics(params),
    placeholderData: (previousData) => previousData,
  });
}
