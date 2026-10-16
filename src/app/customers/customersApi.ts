import { apiFetch } from '@/app/api';
import { buildApiError } from '@/app/api/apiErrors';
import type { CustomerAnalytics, CustomerAnalyticsQuery } from '@/common/types';

const fallbackError = 'Unable to load customers.';

export async function getCustomerAnalytics(params: CustomerAnalyticsQuery) {
  const query = new URLSearchParams();

  if (params.filter?.type && params.filter.month) {
    query.set('filterType', params.filter.type);
    query.set('month', params.filter.month);
  }
  if (params.planId) query.set('planId', params.planId);
  if (params.userId) query.set('userId', params.userId);

  const suffix = query.toString();
  const res = await apiFetch(
    `/admin/analytics/customers${suffix ? `?${suffix}` : ''}`,
  );

  if (!res.ok) {
    throw await buildApiError(res, fallbackError);
  }

  return (await res.json()) as CustomerAnalytics;
}
