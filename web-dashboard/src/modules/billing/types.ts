export interface SubscriptionPlan {
  name: string;
  version: string;
  price: number;
  currency: string;
  period: string;
  maxVehicles: number;
  aiOcrLimit: number;
  smsLimit: number;
}

export interface UsageMetric {
  label: string;
  current: number;
  limit: number;
  color: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface PaymentMethod {
  lastFour: string;
  expiryDate: string;
  isDefault: boolean;
}
