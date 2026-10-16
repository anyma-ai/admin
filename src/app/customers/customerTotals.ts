import { type CustomerAnalytics, PlanType } from '@/common/types';

type CustomerPayment = CustomerAnalytics['payments'][number];

const DAY_MS = 24 * 60 * 60 * 1000;

export type CustomerTotals = {
  revenue: number;
  customers: number;
  payments: number;
  subscriptions: number;
  credits: number;
  subscriptionsRevenue: number;
  creditsRevenue: number;
  avgPayments: number | null;
  twoPlusPayments: number;
  threePlusPayments: number;
  twoPlusShare: number | null;
  threePlusShare: number | null;
  ltv: number | null;
  avgDaysBetween: number | null;
  repeatPayments: number;
  subscriptionFirstShare: number | null;
};

export type CustomerPaymentRow = {
  id: string;
  time: number;
  amount: number;
  type: PlanType;
  planCode: string;
  userId: string;
  username: string | null;
};

export type CustomerRow = {
  id: string;
  username: string;
  payments: number;
  revenue: number;
  subscriptions: number;
  credits: number;
  firstType: PlanType | null;
  firstPaymentTime: number | null;
  lastPaymentTime: number | null;
};

export type CustomerAnalyticsSummary = {
  totals: CustomerTotals;
  paymentRows: CustomerPaymentRow[];
  customerRows: CustomerRow[];
};

function toTime(value: Date | string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

export function summarizeCustomerAnalytics(
  data: CustomerAnalytics,
): CustomerAnalyticsSummary {
  const usernames = new Map(
    data.customers.map((customer) => [customer.id, customer.username]),
  );
  const paymentsById = new Map<string, CustomerPaymentRow>();

  let revenue = 0;
  let subscriptions = 0;
  let credits = 0;
  let subscriptionsRevenue = 0;
  let creditsRevenue = 0;

  data.payments.forEach((payment: CustomerPayment) => {
    revenue += payment.amount;
    if (payment.type === PlanType.Subscription) {
      subscriptions += 1;
      subscriptionsRevenue += payment.amount;
    } else if (payment.type === PlanType.Air) {
      credits += 1;
      creditsRevenue += payment.amount;
    }

    paymentsById.set(payment.id, {
      id: payment.id,
      time: toTime(payment.date),
      amount: payment.amount,
      type: payment.type,
      planCode: payment.plan.code,
      userId: payment.userId,
      username: usernames.get(payment.userId) ?? null,
    });
  });

  let twoPlusPayments = 0;
  let threePlusPayments = 0;
  let payingCustomers = 0;
  let subscriptionFirst = 0;
  let gapsTotalMs = 0;
  let repeatPayments = 0;

  const customerRows = data.customers.map((customer): CustomerRow => {
    const payments = customer.paymentIds
      .map((id) => paymentsById.get(id))
      .filter((payment): payment is CustomerPaymentRow => Boolean(payment))
      .sort((a, b) => a.time - b.time);

    const first = payments[0];
    const last = payments.at(-1);

    if (payments.length >= 2) twoPlusPayments += 1;
    if (payments.length >= 3) threePlusPayments += 1;
    if (first) {
      payingCustomers += 1;
      if (first.type === PlanType.Subscription) subscriptionFirst += 1;
    }
    for (let index = 1; index < payments.length; index += 1) {
      gapsTotalMs += payments[index].time - payments[index - 1].time;
      repeatPayments += 1;
    }

    return {
      id: customer.id,
      username: customer.username,
      payments: payments.length,
      revenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
      subscriptions: payments.filter(
        (payment) => payment.type === PlanType.Subscription,
      ).length,
      credits: payments.filter((payment) => payment.type === PlanType.Air)
        .length,
      firstType: first?.type ?? null,
      firstPaymentTime: first?.time ?? null,
      lastPaymentTime: last?.time ?? null,
    };
  });

  const customers = data.customers.length;
  const avgGapMs = ratio(gapsTotalMs, repeatPayments);

  return {
    totals: {
      revenue,
      customers,
      payments: data.payments.length,
      subscriptions,
      credits,
      subscriptionsRevenue,
      creditsRevenue,
      avgPayments: ratio(data.payments.length, customers),
      twoPlusPayments,
      threePlusPayments,
      twoPlusShare: ratio(twoPlusPayments, customers),
      threePlusShare: ratio(threePlusPayments, customers),
      ltv: ratio(revenue, customers),
      avgDaysBetween: avgGapMs === null ? null : avgGapMs / DAY_MS,
      repeatPayments,
      subscriptionFirstShare: ratio(subscriptionFirst, payingCustomers),
    },
    paymentRows: Array.from(paymentsById.values()).sort(
      (a, b) => b.time - a.time,
    ),
    customerRows: customerRows.sort((a, b) => b.revenue - a.revenue),
  };
}
