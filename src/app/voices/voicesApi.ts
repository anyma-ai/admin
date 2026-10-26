import { apiFetch } from '@/app/api';
import { buildApiError } from '@/app/api/apiErrors';
import type { CreateVoiceDto, IVoice, UpdateVoiceDto } from '@/common/types';

import type { PaginatedResponse } from '../paginated-response.type';

export type VoicesListParams = {
  search?: string;
  order?: string;
  skip?: number;
  take?: number;
};

const listFallbackError = 'Unable to load voices.';
const createFallbackError = 'Unable to create the voice.';
const updateFallbackError = 'Unable to update the voice.';
const deleteFallbackError = 'Unable to delete the voice.';

export async function getVoices(params: VoicesListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.order) query.set('order', params.order);
  if (typeof params.skip === 'number') query.set('skip', String(params.skip));
  if (typeof params.take === 'number') query.set('take', String(params.take));

  const suffix = query.toString();
  const res = await apiFetch(`/admin/voices${suffix ? `?${suffix}` : ''}`);
  if (!res.ok) {
    throw await buildApiError(res, listFallbackError);
  }
  return (await res.json()) as PaginatedResponse<IVoice>;
}

export async function createVoice(payload: CreateVoiceDto) {
  const res = await apiFetch('/admin/voices', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildApiError(res, createFallbackError);
  }
  return (await res.json()) as IVoice;
}

export async function updateVoice(id: string, payload: UpdateVoiceDto) {
  const res = await apiFetch(`/admin/voices/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildApiError(res, updateFallbackError);
  }
  return (await res.json()) as IVoice;
}

export async function deleteVoice(id: string) {
  const res = await apiFetch(`/admin/voices/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw await buildApiError(res, deleteFallbackError);
  }
}
