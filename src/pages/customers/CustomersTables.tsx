import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { formatCount, formatUsd } from '@/app/analytics';
import type { CustomerPaymentRow, CustomerRow } from '@/app/customers';
import { Button, Skeleton, Table, Typography } from '@/atoms';
import { PlanType } from '@/common/types';

import s from './CustomersPage.module.scss';

const SKELETON_ROWS = 6;

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatTime(value: number | null) {
  if (!value) return '-';
  return dateTimeFormatter.format(value);
}

function formatPlanType(type: PlanType | null) {
  if (type === PlanType.Subscription) return 'Subscription';
  if (type === PlanType.Air) return 'Credits';
  return '-';
}

function rightLabel(label: string) {
  return <span className={s.alignRight}>{label}</span>;
}

function UserCell({
  id,
  username,
}: {
  id: string;
  username: string | null;
}) {
  const navigate = useNavigate();
  const name = username?.trim();

  return (
    <div className={s.userCell}>
      <Button
        variant="text"
        size="sm"
        className={s.linkButton}
        onClick={() => navigate(`/users/${id}`)}
      >
        {name ? `@${name}` : 'Unknown user'}
      </Button>
      <Typography variant="caption" tone="muted">
        {id}
      </Typography>
    </div>
  );
}

function NumberCell({ value }: { value: string }) {
  return (
    <Typography variant="body" className={s.alignRight}>
      {value}
    </Typography>
  );
}

const paymentColumns = [
  { key: 'payment', label: 'Payment' },
  { key: 'date', label: 'Date' },
  { key: 'amount', label: rightLabel('Amount') },
  { key: 'type', label: 'Type' },
  { key: 'plan', label: 'Plan' },
  { key: 'user', label: 'User' },
];

export function CustomerPaymentsTable({
  rows,
  loading,
}: {
  rows: CustomerPaymentRow[];
  loading: boolean;
}) {
  const tableRows = useMemo(
    () =>
      loading
        ? Array.from({ length: SKELETON_ROWS }, () => ({
            payment: <Skeleton width={180} height={12} />,
            date: <Skeleton width={120} height={12} />,
            amount: <Skeleton width={60} height={12} />,
            type: <Skeleton width={90} height={12} />,
            plan: <Skeleton width={100} height={12} />,
            user: <Skeleton width={180} height={12} />,
          }))
        : rows.map((payment) => ({
            payment: (
              <Typography variant="caption" tone="muted">
                {payment.id}
              </Typography>
            ),
            date: (
              <Typography variant="body">{formatTime(payment.time)}</Typography>
            ),
            amount: <NumberCell value={formatUsd(payment.amount)} />,
            type: (
              <Typography variant="body">
                {formatPlanType(payment.type)}
              </Typography>
            ),
            plan: <Typography variant="body">{payment.planCode}</Typography>,
            user: <UserCell id={payment.userId} username={payment.username} />,
          })),
    [loading, rows],
  );

  return <Table columns={paymentColumns} rows={tableRows} />;
}

const customerColumns = [
  { key: 'customer', label: 'Customer' },
  { key: 'payments', label: rightLabel('Payments') },
  { key: 'revenue', label: rightLabel('Revenue') },
  { key: 'subscriptions', label: rightLabel('Subscriptions') },
  { key: 'credits', label: rightLabel('Credits') },
  { key: 'firstType', label: 'First purchase' },
  { key: 'firstPayment', label: 'First payment' },
  { key: 'lastPayment', label: 'Last payment' },
];

export function CustomersTable({
  rows,
  loading,
}: {
  rows: CustomerRow[];
  loading: boolean;
}) {
  const tableRows = useMemo(
    () =>
      loading
        ? Array.from({ length: SKELETON_ROWS }, () => ({
            customer: <Skeleton width={180} height={12} />,
            payments: <Skeleton width={40} height={12} />,
            revenue: <Skeleton width={60} height={12} />,
            subscriptions: <Skeleton width={40} height={12} />,
            credits: <Skeleton width={40} height={12} />,
            firstType: <Skeleton width={90} height={12} />,
            firstPayment: <Skeleton width={120} height={12} />,
            lastPayment: <Skeleton width={120} height={12} />,
          }))
        : rows.map((customer) => ({
            customer: <UserCell id={customer.id} username={customer.username} />,
            payments: <NumberCell value={formatCount(customer.payments)} />,
            revenue: <NumberCell value={formatUsd(customer.revenue)} />,
            subscriptions: (
              <NumberCell value={formatCount(customer.subscriptions)} />
            ),
            credits: <NumberCell value={formatCount(customer.credits)} />,
            firstType: (
              <Typography variant="body">
                {formatPlanType(customer.firstType)}
              </Typography>
            ),
            firstPayment: (
              <Typography variant="caption" tone="muted">
                {formatTime(customer.firstPaymentTime)}
              </Typography>
            ),
            lastPayment: (
              <Typography variant="caption" tone="muted">
                {formatTime(customer.lastPaymentTime)}
              </Typography>
            ),
          })),
    [loading, rows],
  );

  return <Table columns={customerColumns} rows={tableRows} />;
}
