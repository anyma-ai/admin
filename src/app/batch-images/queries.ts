import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notifyError, notifySuccess } from '@/app/toast';
import type {
  BatchImgSetCreate,
  BatchImgSetUpdate,
  IBatchImgSetDetails,
} from '@/common/types';

import {
  type BatchImagesListParams,
  createBatchImage,
  deleteBatchImage,
  deleteBatchImageItem,
  getBatchImageDetails,
  getBatchImages,
  regenerateBatchImageItem,
  updateBatchImage,
} from './batchImagesApi';

const batchImageKeys = {
  list: (params: BatchImagesListParams) => ['batch-images', params] as const,
  detail: (id: string) => ['batch-images', 'detail', id] as const,
};

export function useBatchImages(params: BatchImagesListParams) {
  return useQuery({
    queryKey: batchImageKeys.list(params),
    queryFn: () => getBatchImages(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useBatchImageDetails(
  id: string | null,
  initialData?: IBatchImgSetDetails | null,
  options: {
    enabled?: boolean;
    refetchInterval?:
      | number
      | false
      | ((data: IBatchImgSetDetails | undefined) => number | false);
  } = {},
) {
  const resolvedRefetchInterval =
    typeof options.refetchInterval === 'function'
      ? (query: { state: { data: unknown } }) =>
          // @ts-expect-error react-query type mismatch for refetchInterval callback
          options.refetchInterval?.(
            query.state.data as IBatchImgSetDetails | undefined,
          )
      : options.refetchInterval;

  return useQuery({
    queryKey: batchImageKeys.detail(id ?? ''),
    queryFn: () => getBatchImageDetails(id ?? ''),
    enabled: options.enabled ?? Boolean(id),
    initialData: initialData ?? undefined,
    refetchInterval: resolvedRefetchInterval,
  });
}

export function useCreateBatchImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BatchImgSetCreate) => createBatchImage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-images'] });
      notifySuccess('Batch image created.', 'Batch image created.');
    },
    onError: (error) => {
      notifyError(error, 'Unable to create the batch image.');
    },
  });
}

type BatchImageUpdateOptions = {
  id: string;
  payload: BatchImgSetUpdate;
};

export function useUpdateBatchImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: BatchImageUpdateOptions) =>
      updateBatchImage(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batch-images'] });
      queryClient.invalidateQueries({
        queryKey: ['batch-images', 'detail', variables.id],
      });
      notifySuccess('Batch image updated.', 'Batch image updated.');
    },
    onError: (error) => {
      notifyError(error, 'Unable to update the batch image.');
    },
  });
}

export function useDeleteBatchImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBatchImage(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['batch-images'] });
      queryClient.invalidateQueries({
        queryKey: ['batch-images', 'detail', id],
      });
      notifySuccess('Batch image deleted.', 'Batch image deleted.');
    },
    onError: (error) => {
      notifyError(error, 'Unable to delete the batch image.');
    },
  });
}

type BatchImageItemRegenerateOptions = {
  id: string;
  itemId: string;
};

export function useRegenerateBatchImageItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, itemId }: BatchImageItemRegenerateOptions) =>
      regenerateBatchImageItem(id, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batch-images'] });
      queryClient.invalidateQueries({
        queryKey: ['batch-images', 'detail', variables.id],
      });
      notifySuccess('Regenerating item...', 'Batch image item regenerated.');
    },
    onError: (error) => {
      notifyError(error, 'Unable to regenerate batch image item.');
    },
  });
}

type BatchImageItemDeleteOptions = {
  id: string;
  itemId: string;
};

export function useDeleteBatchImageItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, itemId }: BatchImageItemDeleteOptions) =>
      deleteBatchImageItem(id, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batch-images'] });
      queryClient.invalidateQueries({
        queryKey: ['batch-images', 'detail', variables.id],
      });
      notifySuccess('Item deleted.', 'Batch image item deleted.');
    },
    onError: (error) => {
      notifyError(error, 'Unable to delete batch image item.');
    },
  });
}
