import { useQuery } from '@tanstack/react-query';

import type {
  CasinoChatsAnalyticsQuery,
  CasinoChatsListParams,
} from '@/common/types';

import {
  getCasinoAnalytics,
  getCasinoChatDetails,
  getCasinoChats,
} from './casinoApi';

const casinoKeys = {
  chats: (params: CasinoChatsListParams) => ['casino', 'chats', params] as const,
  chat: (id: string) => ['casino', 'chat', id] as const,
  analytics: (params: CasinoChatsAnalyticsQuery) =>
    ['casino', 'analytics', params] as const,
};

export function useCasinoChats(params: CasinoChatsListParams, enabled = true) {
  return useQuery({
    queryKey: casinoKeys.chats(params),
    queryFn: () => getCasinoChats(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useCasinoChatDetails(id: string | null) {
  return useQuery({
    queryKey: casinoKeys.chat(id ?? ''),
    queryFn: () => getCasinoChatDetails(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCasinoAnalytics(
  params: CasinoChatsAnalyticsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: casinoKeys.analytics(params),
    queryFn: () => getCasinoAnalytics(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
