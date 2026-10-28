import { apiFetch } from '@/app/api';
import { buildApiError } from '@/app/api/apiErrors';
import type { IPayment, PaymentsQuery } from '@/common/types';

import type { PaginatedResponse } from '../paginated-response.type';

const fallbackError = 'Unable to load payments.';
const EXPORT_PAGE_SIZE = 1000;

export async function getPayments(params: PaymentsQuery) {
  const query = new URLSearchParams();

  if (params.planId) query.set('planId', params.planId);
  if (params.userId) query.set('userId', params.userId);
  if (params.characterId) query.set('characterId', params.characterId);
  if (params.scenarioId) query.set('scenarioId', params.scenarioId);
  if (params.ref) query.set('ref', params.ref);
  if (params.createdAfter) query.set('createdAfter', params.createdAfter);
  if (params.createdBefore) query.set('createdBefore', params.createdBefore);
  if (params.order) query.set('order', params.order);
  if (typeof params.skip === 'number') query.set('skip', String(params.skip));
  if (typeof params.take === 'number') query.set('take', String(params.take));

  const suffix = query.toString();
  const res = await apiFetch(`/admin/payments${suffix ? `?${suffix}` : ''}`);

  if (!res.ok) {
    throw await buildApiError(res, fallbackError);
  }

  return (await res.json()) as PaginatedResponse<IPayment> & {
    totalSum: number;
    starPrice: number;
  };
}

export async function getAllPayments(
  params: Omit<PaymentsQuery, 'skip' | 'take'>,
) {
  const payments: IPayment[] = [];
  let total = 0;

  do {
    const response = await getPayments({
      ...params,
      skip: payments.length,
      take: EXPORT_PAGE_SIZE,
    });

    total = response.total;
    payments.push(...response.data);

    if (response.data.length === 0) break;
  } while (payments.length < total);

  return payments;
}
