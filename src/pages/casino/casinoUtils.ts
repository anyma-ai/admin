import type { CasinoChat } from '@/common/types';

export const CASINO_PAGE_SIZE_OPTIONS = [20, 50, 100];
export const CASINO_DEFAULT_PAGE_SIZE = 20;
export const CASINO_DEFAULT_ORDER = 'DESC';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatCasinoDate(value: string | null | undefined) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return dateTimeFormatter.format(parsed);
}

export function formatCasinoUser(user: CasinoChat['user'] | null | undefined) {
  const username = user?.username?.trim();
  return username ? `@${username}` : 'Unknown user';
}

export function formatCasinoUserMeta(
  user: CasinoChat['user'] | null | undefined,
) {
  const username = user?.username?.trim();
  if (username && user?.id) return `${username} / ${user.id}`;
  return user?.id ?? '-';
}

export function formatCasinoLabel(value: string) {
  return value
    .toLowerCase()
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function parseCasinoLevel(value: string | null) {
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export function parseCasinoPageSize(value: string | null) {
  const parsed = parsePositiveNumber(value, CASINO_DEFAULT_PAGE_SIZE);
  return CASINO_PAGE_SIZE_OPTIONS.includes(parsed)
    ? parsed
    : CASINO_DEFAULT_PAGE_SIZE;
}

export function normalizeCasinoDate(value: string | null) {
  const trimmed = value?.trim() ?? '';
  return datePattern.test(trimmed) ? trimmed : '';
}
