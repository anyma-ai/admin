import type { PlanType } from "./plan.type";

export interface CustomerAnalyticsQuery {
    filter?: {
      type: 'firstPayed' | 'registered' | 'within';
      month: string;
    };
    planId?: string;
    userId?: string;
  }
  
  export interface CustomerAnalytics {
    payments: {
      id: string;
      date: Date;
      amount: number;
      type: PlanType;
      plan: {
        id: string;
        code: string;
      };
      userId: string;
    }[];
    customers: {
      id: string;
      username: string;
      paymentIds: string[];
    }[];
  }