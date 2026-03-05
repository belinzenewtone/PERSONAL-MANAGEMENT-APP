// ─── Database Entity Types ────────────────────────────────────────────────────

export type TaskCategory = 'work' | 'growth' | 'personal';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type EventType = 'meeting' | 'study' | 'personal' | 'bill';

export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'mpesa' | 'bank' | 'cash';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  created_at: string;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  estimated_minutes: number | null;
  deadline: string | null;
  status: TaskStatus;
  ticket_reference: string | null;
  recurring: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurring_parent_id: string | null;
  created_at: string;
}

export type CreateTaskInput = Omit<Task, 'id' | 'user_id' | 'created_at'>;
export type UpdateTaskInput = Partial<CreateTaskInput>;

// ─── Event ────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: EventType;
  related_task_id: string | null;
  created_at: string;
}

export type CreateEventInput = Omit<CalendarEvent, 'id' | 'user_id' | 'created_at'>;
export type UpdateEventInput = Partial<CreateEventInput>;

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  source: TransactionSource;
  mpesa_code: string | null;
  auto_imported: boolean;
  transaction_date: string;
  created_at: string;
}

export type CreateTransactionInput = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;
export type UpdateTransactionInput = Partial<CreateTransactionInput>;

// ─── Learning Session ─────────────────────────────────────────────────────────

export interface LearningSession {
  id: string;
  user_id: string;
  topic: string;
  duration_minutes: number;
  completed: boolean;
  created_at: string;
}

export type CreateLearningSessionInput = Omit<LearningSession, 'id' | 'user_id' | 'created_at'>;

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DailySpendSummary {
  date: string;
  total_expense: number;
  total_income: number;
}

export interface MonthlySpendSummary {
  month: string;
  total_expense: number;
  total_income: number;
  savings_rate: number;
}

export interface CategoryBreakdownMonthly {
  month: string;
  category: string;
  total: number;
}
