import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useCasinoAnalytics } from '@/app/casino';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  FormRow,
  Grid,
  Input,
  Section,
  Skeleton,
  Stack,
  Table,
  Typography,
} from '@/atoms';

import s from './CasinoPages.module.scss';
import { normalizeCasinoDate, parseCasinoLevel } from './casinoUtils';

type QueryUpdate = {
  from?: string;
  to?: string;
  level?: string;
};

function formatNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString()
    : '-';
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  return (
    <Card className={s.metricCard}>
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <Typography variant="h2" className={s.metricValue}>
        {formatNumber(value)}
      </Typography>
    </Card>
  );
}

export function CasinoAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawFrom = searchParams.get('from');
  const rawTo = searchParams.get('to');
  const rawLevel = searchParams.get('level');

  const from = normalizeCasinoDate(rawFrom);
  const to = normalizeCasinoDate(rawTo);
  const level = parseCasinoLevel(rawLevel);
  const levelValue = level === undefined ? '' : String(level);

  const updateSearchParams = useCallback(
    (update: QueryUpdate, replace = false) => {
      const next = new URLSearchParams(searchParams);

      if (update.from !== undefined) {
        const nextFrom = normalizeCasinoDate(update.from);
        if (nextFrom) next.set('from', nextFrom);
        else next.delete('from');
      }

      if (update.to !== undefined) {
        const nextTo = normalizeCasinoDate(update.to);
        if (nextTo) next.set('to', nextTo);
        else next.delete('to');
      }

      if (update.level !== undefined) {
        const nextLevel = parseCasinoLevel(update.level);
        if (nextLevel !== undefined) next.set('level', String(nextLevel));
        else next.delete('level');
      }

      setSearchParams(next, { replace });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (
      (rawFrom ?? '') === from &&
      (rawTo ?? '') === to &&
      (rawLevel ?? '') === levelValue
    ) {
      return;
    }

    updateSearchParams({ from, to, level: levelValue }, true);
  }, [from, levelValue, rawFrom, rawLevel, rawTo, to, updateSearchParams]);

  const queryParams = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      level,
    }),
    [from, level, to],
  );

  const { data, error, isLoading, refetch } = useCasinoAnalytics(queryParams);
  const levels = useMemo(() => {
    const keys = new Set([
      ...Object.keys(data?.chatsLevels ?? {}),
      ...Object.keys(data?.msgLevels ?? {}),
    ]);

    return Array.from(keys)
      .map(Number)
      .filter(Number.isFinite)
      .sort((left, right) => left - right);
  }, [data?.chatsLevels, data?.msgLevels]);

  const levelRows = useMemo(
    () =>
      levels.map((item) => ({
        level: (
          <Badge tone="accent" outline>
            {item}
          </Badge>
        ),
        chats: (
          <Typography variant="body">
            {formatNumber(data?.chatsLevels?.[item])}
          </Typography>
        ),
        messages: (
          <Typography variant="body">
            {formatNumber(data?.msgLevels?.[item])}
          </Typography>
        ),
      })),
    [data?.chatsLevels, data?.msgLevels, levels],
  );

  const levelSkeletonRows = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => ({
        level: <Skeleton key={`level-${index}`} width={48} height={20} />,
        chats: <Skeleton width={80} height={12} />,
        messages: <Skeleton width={80} height={12} />,
      })),
    [],
  );

  const showSkeleton = isLoading && !data;
  const showLevelEmpty = !showSkeleton && !error && levels.length === 0;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.titleBlock}>
          <Typography variant="h2">Analytics</Typography>
          <Typography variant="caption" tone="muted">
            Casino activity
          </Typography>
        </div>
      </div>

      <div className={s.analyticsStack}>
        {error ? (
          <Stack className={s.state} gap="12px">
            <Alert
              title="Unable to load casino analytics"
              description={
                error instanceof Error ? error.message : 'Please try again.'
              }
              tone="warning"
            />
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </Stack>
        ) : null}

        <div className={s.filters}>
          <FormRow columns={3}>
            <Field label="From" labelFor="casino-analytics-from">
              <Input
                id="casino-analytics-from"
                type="date"
                value={from}
                size="sm"
                onChange={(event) =>
                  updateSearchParams({ from: event.target.value })
                }
                fullWidth
              />
            </Field>
            <Field label="To" labelFor="casino-analytics-to">
              <Input
                id="casino-analytics-to"
                type="date"
                value={to}
                size="sm"
                onChange={(event) =>
                  updateSearchParams({ to: event.target.value })
                }
                fullWidth
              />
            </Field>
            <Field label="Level" labelFor="casino-analytics-level">
              <Input
                id="casino-analytics-level"
                type="number"
                min={0}
                step={1}
                value={levelValue}
                size="sm"
                onChange={(event) =>
                  updateSearchParams({ level: event.target.value })
                }
                fullWidth
              />
            </Field>
          </FormRow>
          <Typography variant="caption" tone="muted">
            Dates use YYYY-MM-DD and empty filters are omitted from requests.
          </Typography>
        </div>

        <Section title="Totals">
          {showSkeleton ? (
            <Grid columns={3} gap="16px">
              {Array.from({ length: 3 }, (_, index) => (
                <Card className={s.metricCard} key={`metric-${index}`}>
                  <Skeleton width={120} height={12} />
                  <Skeleton width={80} height={28} />
                </Card>
              ))}
            </Grid>
          ) : (
            <Grid columns={3} gap="16px">
              <MetricCard label="Chats" value={data?.chatsTotal} />
              <MetricCard label="Users" value={data?.users} />
              <MetricCard label="Messages" value={data?.msgTotal} />
            </Grid>
          )}
        </Section>

        <Section title="Levels">
          {showLevelEmpty ? (
            <EmptyState title="No level data" description="Adjust filters." />
          ) : (
            <Table
              columns={[
                { key: 'level', label: 'Level' },
                { key: 'chats', label: 'Chats' },
                { key: 'messages', label: 'Messages' },
              ]}
              rows={showSkeleton ? levelSkeletonRows : levelRows}
            />
          )}
        </Section>
      </div>
    </div>
  );
}
