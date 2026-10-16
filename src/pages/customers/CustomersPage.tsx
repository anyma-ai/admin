import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  formatCount,
  getCurrentMonthId,
  isValidMonthId,
} from '@/app/analytics';
import { summarizeCustomerAnalytics, useCustomerAnalytics } from '@/app/customers';
import { usePlans } from '@/app/plans';
import { useUsers } from '@/app/users';
import {
  Alert,
  Button,
  Container,
  EmptyState,
  Field,
  Input,
  Pagination,
  Select,
  Stack,
  Tabs,
  Typography,
} from '@/atoms';
import type {
  CustomerAnalyticsQuery,
  ITgUser,
  PlanType,
} from '@/common/types';
import { AppShell } from '@/components/templates';
import { SearchSelect } from '@/molecules';

import s from './CustomersPage.module.scss';
import { CustomerPaymentsTable, CustomersTable } from './CustomersTables';
import { CustomersTotals } from './CustomersTotals';

type FilterType = NonNullable<CustomerAnalyticsQuery['filter']>['type'];
type FilterValue = FilterType | typeof ANY_FILTER;
type CustomersTab = 'payments' | 'customers';

type QueryUpdate = {
  filterType?: FilterValue;
  month?: string;
  planId?: string;
  userId?: string;
  tab?: CustomersTab;
  page?: number;
  pageSize?: number;
};

const ANY_FILTER = 'any';
const DEFAULT_FILTER: FilterValue = ANY_FILTER;
const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: 'All time', value: ANY_FILTER },
  { label: 'First payment month', value: 'firstPayed' },
  { label: 'Registration month', value: 'registered' },
  { label: 'Payments within month', value: 'within' },
];
const FILTER_VALUES = new Set<string>(
  FILTER_OPTIONS.map((option) => option.value),
);

const DEFAULT_TAB: CustomersTab = 'payments';
const TAB_VALUES = new Set<string>(['payments', 'customers']);

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

function formatUserName(user: ITgUser) {
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  if (fullName) return fullName;
  const username = user.username?.trim();
  if (username) return `@${username}`;
  return 'Unknown user';
}

function formatUserMeta(user: ITgUser) {
  const username = user.username?.trim();
  return username ? `@${username} / ${user.id}` : user.id;
}

function formatPlanType(type: PlanType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parsePageSize(value: string | null) {
  const parsed = parsePositiveNumber(value, DEFAULT_PAGE_SIZE);
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

export function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultMonth = useMemo(() => getCurrentMonthId(), []);

  const rawFilterType = searchParams.get('filterType');
  const rawMonth = searchParams.get('month');
  const rawTab = searchParams.get('tab');
  const rawPage = searchParams.get('page');
  const rawPageSize = searchParams.get('pageSize');

  const filterType = (
    FILTER_VALUES.has(rawFilterType ?? '') ? rawFilterType : DEFAULT_FILTER
  ) as FilterValue;
  const month = isValidMonthId(rawMonth) ? rawMonth : defaultMonth;
  const planId = (searchParams.get('planId') ?? '').trim();
  const userId = (searchParams.get('userId') ?? '').trim();
  const tab = (TAB_VALUES.has(rawTab ?? '') ? rawTab : DEFAULT_TAB) as CustomersTab;
  const page = parsePositiveNumber(rawPage, 1);
  const pageSize = parsePageSize(rawPageSize);

  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebouncedValue(userSearch, SEARCH_DEBOUNCE_MS);

  const updateSearchParams = useCallback(
    (update: QueryUpdate, replace = false) => {
      const next = new URLSearchParams(searchParams);
      const updateString = (key: string, value: string, fallback = '') => {
        const normalized = value.trim();
        if (normalized && normalized !== fallback) next.set(key, normalized);
        else next.delete(key);
      };

      if (update.filterType !== undefined) {
        updateString('filterType', update.filterType, DEFAULT_FILTER);
      }
      if (update.month !== undefined) updateString('month', update.month);
      if (update.planId !== undefined) updateString('planId', update.planId);
      if (update.userId !== undefined) updateString('userId', update.userId);
      if (update.tab !== undefined) updateString('tab', update.tab, DEFAULT_TAB);

      if (update.page !== undefined) {
        if (update.page > 1) next.set('page', String(update.page));
        else next.delete('page');
      }

      if (update.pageSize !== undefined) {
        if (update.pageSize !== DEFAULT_PAGE_SIZE) {
          next.set('pageSize', String(update.pageSize));
        } else {
          next.delete('pageSize');
        }
      }

      setSearchParams(next, { replace });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const update: QueryUpdate = {};
    let shouldNormalize = false;

    if (rawFilterType && rawFilterType !== filterType) {
      update.filterType = filterType;
      shouldNormalize = true;
    }
    if (rawMonth && rawMonth !== month) {
      update.month = '';
      shouldNormalize = true;
    }
    if (rawTab && rawTab !== tab) {
      update.tab = tab;
      shouldNormalize = true;
    }
    if (rawPage && rawPage !== String(page)) {
      update.page = page;
      shouldNormalize = true;
    }
    if (rawPageSize && rawPageSize !== String(pageSize)) {
      update.pageSize = pageSize;
      shouldNormalize = true;
    }

    if (shouldNormalize) updateSearchParams(update, true);
  }, [
    filterType,
    month,
    page,
    pageSize,
    rawFilterType,
    rawMonth,
    rawPage,
    rawPageSize,
    rawTab,
    tab,
    updateSearchParams,
  ]);

  const usersQuery = useUsers({
    search: debouncedUserSearch.trim() || undefined,
    order: 'DESC',
    skip: 0,
    take: 20,
  });
  const plansQuery = usePlans({ order: 'ASC', skip: 0, take: 1000 });

  const query = useMemo<CustomerAnalyticsQuery>(
    () => ({
      filter: filterType === ANY_FILTER ? undefined : { type: filterType, month },
      planId: planId || undefined,
      userId: userId || undefined,
    }),
    [filterType, month, planId, userId],
  );

  const { data, error, isLoading, refetch } = useCustomerAnalytics(query);
  const summary = useMemo(
    () => (data ? summarizeCustomerAnalytics(data) : null),
    [data],
  );

  const userOptions = useMemo(
    () =>
      (usersQuery.data?.data ?? []).map((user) => ({
        id: user.id,
        label: formatUserName(user),
        meta: formatUserMeta(user),
      })),
    [usersQuery.data?.data],
  );

  const planOptions = useMemo(
    () => [
      { label: 'Any', value: '' },
      ...(plansQuery.data?.data ?? []).map((plan) => ({
        label: `${plan.code} · ${formatPlanType(plan.type)}`,
        value: plan.id,
      })),
    ],
    [plansQuery.data?.data],
  );

  const selectedUserLabel = useMemo(() => {
    if (!userId) return '';
    const option = userOptions.find((item) => item.id === userId);
    if (option) return option.label;
    const username = data?.customers.find((item) => item.id === userId)?.username;
    return username ? `@${username}` : userId;
  }, [data?.customers, userId, userOptions]);

  const tabRows =
    tab === 'payments'
      ? (summary?.paymentRows ?? [])
      : (summary?.customerRows ?? []);
  const total = tabRows.length;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
  const pageStart = (page - 1) * pageSize;

  useEffect(() => {
    if (!summary || total === 0 || page <= totalPages) return;
    updateSearchParams({ page: totalPages }, true);
  }, [page, summary, total, totalPages, updateSearchParams]);

  const paymentRows = useMemo(
    () => (summary?.paymentRows ?? []).slice(pageStart, pageStart + pageSize),
    [pageSize, pageStart, summary?.paymentRows],
  );
  const customerRows = useMemo(
    () => (summary?.customerRows ?? []).slice(pageStart, pageStart + pageSize),
    [pageSize, pageStart, summary?.customerRows],
  );

  const tabItems = useMemo(
    () => [
      {
        value: 'payments',
        label: summary
          ? `Payments (${formatCount(summary.totals.payments)})`
          : 'Payments',
      },
      {
        value: 'customers',
        label: summary
          ? `Customers (${formatCount(summary.totals.customers)})`
          : 'Customers',
      },
    ],
    [summary],
  );

  const showSkeleton = isLoading && !data;
  const showEmpty = !showSkeleton && !error && total === 0;
  const showTable = !showEmpty && !error;
  const showFooter = showTable && !showSkeleton;
  const rangeStart = total === 0 ? 0 : pageStart + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(pageStart + pageSize, total);

  return (
    <AppShell>
      <Container size="wide" className={s.page}>
        <div className={s.header}>
          <Typography variant="h2">Customers</Typography>
        </div>

        <div className={s.filters}>
          <div className={s.filterRow}>
            <Field
              className={s.filterField}
              label="Filter by"
              labelFor="customers-filter-type"
            >
              <Select
                id="customers-filter-type"
                options={FILTER_OPTIONS}
                value={filterType}
                size="sm"
                variant="ghost"
                onChange={(value) =>
                  updateSearchParams({
                    filterType: value as FilterValue,
                    page: 1,
                  })
                }
              />
            </Field>
            {filterType === ANY_FILTER ? null : (
              <Field
                className={s.filterFieldSm}
                label="Month"
                labelFor="customers-month"
              >
                <Input
                  id="customers-month"
                  type="month"
                  size="sm"
                  value={month}
                  onChange={(event) =>
                    updateSearchParams({
                      month:
                        event.target.value === defaultMonth
                          ? ''
                          : event.target.value,
                      page: 1,
                    })
                  }
                  fullWidth
                />
              </Field>
            )}
            <Field
              className={s.filterField}
              label="Plan"
              labelFor="customers-plan"
            >
              <Select
                id="customers-plan"
                options={planOptions}
                value={planId}
                size="sm"
                variant="ghost"
                onChange={(value) =>
                  updateSearchParams({ planId: value, page: 1 })
                }
                disabled={plansQuery.isLoading && !plansQuery.data}
              />
            </Field>
            <Field
              className={s.filterField}
              label="User"
              labelFor="customers-user"
            >
              <SearchSelect
                id="customers-user"
                value={userId}
                valueLabel={selectedUserLabel}
                options={userOptions}
                search={userSearch}
                onSearchChange={setUserSearch}
                onSelect={(value) =>
                  updateSearchParams({ userId: value, page: 1 })
                }
                placeholder={
                  usersQuery.isLoading ? 'Loading users...' : 'Select user'
                }
                loading={usersQuery.isLoading}
                disabled={usersQuery.isLoading}
                emptyLabel="No users found."
              />
            </Field>
          </div>
        </div>

        {error ? (
          <Stack className={s.state} gap="12px">
            <Alert
              title="Unable to load customers"
              description={
                error instanceof Error ? error.message : 'Please try again.'
              }
              tone="warning"
            />
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </Stack>
        ) : (
          <CustomersTotals
            totals={summary?.totals ?? null}
            loading={showSkeleton}
          />
        )}

        {error ? null : (
          <div className={s.tableWrap}>
            <Tabs
              items={tabItems}
              value={tab}
              onChange={(value) =>
                updateSearchParams({ tab: value as CustomersTab, page: 1 })
              }
            />

            {showEmpty ? (
              <EmptyState
                title={
                  tab === 'payments' ? 'No payments found' : 'No customers found'
                }
                description="Try another month or adjust the filters."
              />
            ) : null}

            {showTable && tab === 'payments' ? (
              <CustomerPaymentsTable rows={paymentRows} loading={showSkeleton} />
            ) : null}
            {showTable && tab === 'customers' ? (
              <CustomersTable rows={customerRows} loading={showSkeleton} />
            ) : null}

            {showFooter ? (
              <div className={s.footer}>
                <Typography variant="caption" tone="muted">
                  Showing {rangeStart}-{rangeEnd} of {total.toLocaleString()}
                </Typography>
                <div className={s.paginationRow}>
                  <Field label="Page size" labelFor="customers-page-size">
                    <Select
                      id="customers-page-size"
                      size="sm"
                      variant="ghost"
                      value={String(pageSize)}
                      options={PAGE_SIZE_OPTIONS.map((value) => ({
                        label: String(value),
                        value: String(value),
                      }))}
                      onChange={(value) =>
                        updateSearchParams({ pageSize: Number(value), page: 1 })
                      }
                    />
                  </Field>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={(nextPage) =>
                      updateSearchParams({ page: nextPage })
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Container>
    </AppShell>
  );
}
