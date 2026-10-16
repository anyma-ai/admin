import { formatCount, formatPercent, formatUsd } from '@/app/analytics';
import type { CustomerTotals } from '@/app/customers';
import { Card, Section, Skeleton, Typography } from '@/atoms';

import s from './CustomersPage.module.scss';

type TotalCard = {
  label: string;
  value: string;
  meta?: string;
};

const EMPTY_VALUE = '—';

function formatOptional(
  value: number | null,
  format: (value: number) => string,
) {
  return value === null ? EMPTY_VALUE : format(value);
}

function buildCards(totals: CustomerTotals): TotalCard[] {
  return [
    { label: 'Revenue', value: formatUsd(totals.revenue) },
    {
      label: 'LTV',
      value: formatOptional(totals.ltv, formatUsd),
      meta: 'Revenue / customers',
    },
    { label: 'Customers', value: formatCount(totals.customers) },
    { label: 'Payments', value: formatCount(totals.payments) },
    {
      label: 'Subscription / Credits',
      value: `${formatCount(totals.subscriptions)} / ${formatCount(totals.credits)}`,
    },
    {
      label: 'Subscriptions revenue',
      value: formatUsd(totals.subscriptionsRevenue),
    },
    { label: 'Credits revenue', value: formatUsd(totals.creditsRevenue) },
    {
      label: 'Avg payments',
      value: formatOptional(totals.avgPayments, (value) =>
        formatCount(value, 2),
      ),
      meta: 'Per customer',
    },
    {
      label: '2+ payments',
      value: formatCount(totals.twoPlusPayments),
      meta: `${formatOptional(totals.twoPlusShare, formatPercent)} of customers`,
    },
    {
      label: '3+ payments',
      value: formatCount(totals.threePlusPayments),
      meta: `${formatOptional(totals.threePlusShare, formatPercent)} of customers`,
    },
    {
      label: 'Time between',
      value: formatOptional(
        totals.avgDaysBetween,
        (value) => `${formatCount(value, 1)} days`,
      ),
      meta: `Avg gap over ${formatCount(totals.repeatPayments)} repeat payments`,
    },
    {
      label: 'Subscription first',
      value: formatOptional(totals.subscriptionFirstShare, formatPercent),
      meta: 'First payment is a subscription',
    },
  ];
}

const SKELETON_COUNT = 12;

export function CustomersTotals({
  totals,
  loading,
}: {
  totals: CustomerTotals | null;
  loading: boolean;
}) {
  return (
    <Section title="Totals">
      <div className={s.kpiGrid}>
        {loading || !totals
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <Card key={index} className={s.kpiCard} padding="md">
                <Skeleton width={100} height={12} />
                <Skeleton width={80} height={24} />
              </Card>
            ))
          : buildCards(totals).map((card) => (
              <Card key={card.label} className={s.kpiCard} padding="md">
                <Typography variant="meta" tone="muted">
                  {card.label}
                </Typography>
                <Typography variant="h3">{card.value}</Typography>
                {card.meta ? (
                  <Typography variant="caption" tone="muted">
                    {card.meta}
                  </Typography>
                ) : null}
              </Card>
            ))}
      </div>
    </Section>
  );
}
