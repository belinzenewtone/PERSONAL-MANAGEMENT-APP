export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Utilities',
  'Rent',
  'Shopping',
  'Healthcare',
  'Entertainment',
  'Education',
  'Savings',
  'Loans',
  'Family',
  'Other',
] as const;

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'M-Pesa Received',
  'Investment',
  'Other Income',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory  = typeof INCOME_CATEGORIES[number];

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining':   '#f59e0b',
  'Transport':       '#3b82f6',
  'Utilities':       '#8b5cf6',
  'Rent':            '#ef4444',
  'Shopping':        '#ec4899',
  'Healthcare':      '#22c55e',
  'Entertainment':   '#f97316',
  'Education':       '#06b6d4',
  'Savings':         '#10b981',
  'Loans':           '#dc2626',
  'Family':          '#a855f7',
  'Other':           '#6b7280',
  'Salary':          '#22c55e',
  'Freelance':       '#3b82f6',
  'Business':        '#f59e0b',
  'M-Pesa Received': '#10b981',
  'Investment':      '#8b5cf6',
  'Other Income':    '#6b7280',
};
