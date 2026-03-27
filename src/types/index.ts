export type PaymentType = 'Bank Transfer' | 'Cash';

export interface Account {
  id: string;
  name: string;
  currency: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Movement {
  id: string;
  date: string;
  shortDescription: string;
  longDescription: string;
  amount: number;
  paymentType: PaymentType;
  labelId?: string;
  accountId?: string;
}

export interface Reminder {
  id: string;
  title: string;
  type: 'once' | 'recurrent';
  dueDate: string;
  dismissed: boolean;
  accountId?: string;
  startsAt?: string;
  validUntil?: string;
  lastDismissedOccurrenceAt?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface User {
  username: string;
  role: 'admin' | 'user';
}

export interface QuickFinancialReport {
  totalIncome: number;
  totalExpenses: number;
  monthlyBalance: number;
}