import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notifyError, notifySuccess } from '@/app/toast';
import type { CreateVoiceDto, UpdateVoiceDto } from '@/common/types';

import {
  createVoice,
  deleteVoice,
  getVoices,
  updateVoice,
  type VoicesListParams,
} from './voicesApi';

const voiceKeys = {
  list: (params: VoicesListParams) => ['voices', params] as const,
};

export function useVoices(params: VoicesListParams) {
  return useQuery({
    queryKey: voiceKeys.list(params),
    queryFn: () => getVoices(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVoiceDto) => createVoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voices'] });
      notifySuccess('Voice created.', 'Voice created.');
    },
    onError: (error) => {
      notifyError(error, 'Unable to create the voice.');
    },
  });
}

type VoiceUpdateOptions = {
  id: string;
  payload: UpdateVoiceDto;
};

export function useUpdateVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: VoiceUpdateOptions) =>
      updateVoice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voices'] });
      notifySuccess('Voice updated.', 'Voice updated.');
    },
    onError: (error) => {
      notifyError(error, 'Unable to update the voice.');
    },
  });
}

export function useDeleteVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voices'] });
      notifySuccess('Voice deleted.', 'Voice deleted.');
    },
    onError: (error) => {
      notifyError(error, 'Unable to delete the voice.');
    },
  });
}
