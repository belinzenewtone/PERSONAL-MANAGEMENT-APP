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

export type ThemeMode = 'dark' | 'light' | 'system';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  timezone: string;
  theme_mode: ThemeMode;
  notifications_enabled: boolean;
  biometric_lock_enabled: boolean;
  assistant_suggestions_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type UpdateProfileInput = Partial<
  Omit<Profile, 'id' | 'created_at' | 'updated_at'>
>;

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
  is_pinned: boolean;
  created_at: string;
}

export type CreateTaskInput = Omit<Task, 'id' | 'user_id' | 'created_at' | 'is_pinned'> & {
  is_pinned?: boolean;
};
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
  is_pinned: boolean;
  transaction_date: string;
  created_at: string;
}

export type CreateTransactionInput = Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'is_pinned'> & {
  is_pinned?: boolean;
};
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

// ─── Assistant ────────────────────────────────────────────────────────────────

export type AssistantRole = 'user' | 'assistant';

export interface AssistantConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AssistantMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: AssistantRole;
  content: string;
  created_at: string;
}

export interface AssistantChatResponse {
  conversation: AssistantConversation;
  messages: AssistantMessage[];
}

export interface AssistantChatRequest {
  message: string;
  conversationId?: string;
  workspaceContext?: string;
}

// ─── Merchant Learning ───────────────────────────────────────────────────────

export interface MerchantCategoryRule {
  id: string;
  user_id: string;
  merchant: string;
  normalized_merchant: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// ─── App Updates ─────────────────────────────────────────────────────────────

export interface AppUpdateRecord {
  id: string;
  platform: 'android' | 'ios';
  current_version: string;
  minimum_supported_version: string | null;
  store_url: string | null;
  title: string | null;
  message: string | null;
  changelog: string[] | null;        // bullet-point list of changes
  bundle_size_bytes: number | null;  // OTA bundle download size in bytes
  is_force: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Recurring Templates ─────────────────────────────────────────────────────

export type RecurringEntityType = 'task' | 'event' | 'expense' | 'income';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTemplate {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  entity_type: RecurringEntityType;
  frequency: RecurringFrequency;
  start_date: string;
  next_run_at: string;
  last_run_at: string | null;
  active: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

export type CreateRecurringTemplateInput = Omit<
  RecurringTemplate,
  'id' | 'user_id' | 'last_run_at' | 'created_at'
>;

export type UpdateRecurringTemplateInput = Partial<CreateRecurringTemplateInput>;
