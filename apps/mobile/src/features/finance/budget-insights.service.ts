import { isAfter } from 'date-fns';
import type { CalendarEvent, Task, Transaction } from '@personal-os/types';
import type { Budget } from './budget.service';

export interface BudgetAlert {
  key: string;
  title: string;
  body: string;
}

const THRESHOLDS = [80, 100, 120];

export function buildBudgetAlerts(
  budgets: Budget[],
  transactions: Transaction[],
  nowIso: string,
  sentAlerts: Record<string, string>,
) {
  const alerts: BudgetAlert[] = [];

  for (const budget of budgets) {
    const spent = transactions
      .filter((transaction) => transaction.type === 'expense' && transaction.category === budget.category)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const pct = budget.amount > 0 ? Math.round((spent / Number(budget.amount)) * 100) : 0;
    const threshold = THRESHOLDS.filter((value) => pct >= value).pop();
    if (!threshold) continue;

    const key = `${budget.category}-${threshold}`;
    if (sentAlerts[key] === nowIso.slice(0, 10)) continue;

    alerts.push({
      key,
      title: `${budget.category} budget at ${threshold}%`,
      body: `You have spent KES ${spent.toLocaleString()} against a KES ${Number(budget.amount).toLocaleString()} budget.`,
    });
  }

  return alerts;
}

export function buildDailyDigest(
  tasks: Task[],
  transactions: Transaction[],
  budgets: Budget[],
  events: CalendarEvent[],
  now: Date,
) {
  const digestStart = new Date(now);
  digestStart.setHours(7, 0, 0, 0);

  if (!isAfter(now, digestStart)) {
    return null;
  }

  const todayTasks = tasks.filter((task) => task.deadline && task.deadline.slice(0, 10) === now.toISOString().slice(0, 10));
  const openTasks = todayTasks.filter((task) => task.status !== 'done').length;
  const todayEvents = events.filter((event) => event.start_time.slice(0, 10) === now.toISOString().slice(0, 10)).length;
  const monthExpenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const budgetCount = budgets.length;

  return {
    title: 'Daily Personal OS digest',
    body: `${openTasks} task${openTasks === 1 ? '' : 's'} due today, ${todayEvents} event${todayEvents === 1 ? '' : 's'} scheduled, KES ${monthExpenses.toLocaleString()} spent this month, ${budgetCount} budget${budgetCount === 1 ? '' : 's'} tracked.`,
  };
}
