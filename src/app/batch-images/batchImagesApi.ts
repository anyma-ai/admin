import { apiFetch } from '@/app/api';
import { buildApiError } from '@/app/api/apiErrors';
import type {
  BatchImgSetCreate,
  BatchImgSetUpdate,
  IBatchImgSet,
  IBatchImgSetDetails,
} from '@/common/types';

import type { PaginatedResponse } from '../paginated-response.type';

export type BatchImagesListParams = {
  search?: string;
  order?: string;
  skip?: number;
  take?: number;
};

const listFallbackError = 'Unable to load batch images.';
const createFallbackError = 'Unable to create the batch image.';
const updateFallbackError = 'Unable to update the batch image.';
const deleteFallbackError = 'Unable to delete the batch image.';
const regenerateItemFallbackError = 'Unable to regenerate batch image item.';
const deleteItemFallbackError = 'Unable to delete batch image item.';

async function parseJsonIfPresent(res: Response) {
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

export async function getBatchImages(params: BatchImagesListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.order) query.set('order', params.order);
  if (typeof params.skip === 'number') query.set('skip', String(params.skip));
  if (typeof params.take === 'number') query.set('take', String(params.take));

  const suffix = query.toString();
  const res = await apiFetch(`/admin/batch-images${suffix ? `?${suffix}` : ''}`);
  if (!res.ok) {
    throw await buildApiError(res, listFallbackError);
  }
  return (await res.json()) as PaginatedResponse<IBatchImgSet>;
}

export async function getBatchImageDetails(id: string) {
  const res = await apiFetch(`/admin/batch-images/${id}`);
  if (!res.ok) {
    throw await buildApiError(res, listFallbackError);
  }
  const details = (await res.json()) as IBatchImgSetDetails;
  details.items.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return details;
}

export async function createBatchImage(payload: BatchImgSetCreate) {
  const res = await apiFetch('/admin/batch-images', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildApiError(res, createFallbackError);
  }
  return (await res.json()) as IBatchImgSetDetails;
}

export async function updateBatchImage(id: string, payload: BatchImgSetUpdate) {
  const res = await apiFetch(`/admin/batch-images/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildApiError(res, updateFallbackError);
  }
  return await parseJsonIfPresent(res);
}

export async function deleteBatchImage(id: string) {
  const res = await apiFetch(`/admin/batch-images/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw await buildApiError(res, deleteFallbackError);
  }
  return await parseJsonIfPresent(res);
}

export async function regenerateBatchImageItem(id: string, itemId: string) {
  const res = await apiFetch(
    `/admin/batch-images/${id}/items/${itemId}/regenerate`,
    {
      method: 'POST',
    },
  );
  if (!res.ok) {
    throw await buildApiError(res, regenerateItemFallbackError);
  }
  return await parseJsonIfPresent(res);
}

export async function deleteBatchImageItem(id: string, itemId: string) {
  const res = await apiFetch(`/admin/batch-images/${id}/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw await buildApiError(res, deleteItemFallbackError);
  }
  return await parseJsonIfPresent(res);
}
