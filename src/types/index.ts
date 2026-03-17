export type PaymentType = 'Bank Transfer' | 'Cash';

export interface Movement {
  id: string;
  date: string;
  shortDescription: string;
  longDescription: string;
  amount: number;
  paymentType: PaymentType;
}

export interface Reminder {
  id: string;
  title: string;
  type: 'once' | 'recurrent';
  dueDate: string;
  dismissed: boolean;
}

export interface User {
  username: string;
  role: 'admin' | 'user';
}
