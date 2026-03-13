import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBudgetAlerts, buildDailyDigest } from './budget-insights.service';

const budget = { id: '1', user_id: 'u1', category: 'transport', amount: 1000, period: 'month', created_at: '2026-03-10T00:00:00Z' };
const expense = { id: 't1', user_id: 'u1', amount: 1250, type: 'expense' as const, category: 'transport', description: null, source: 'cash' as const, mpesa_code: null, auto_imported: false, is_pinned: false, transaction_date: '2026-03-10T08:00:00Z', created_at: '2026-03-10T08:00:00Z' };

test('buildBudgetAlerts emits the highest unsent threshold for a category', () => {
  const alerts = buildBudgetAlerts([budget], [expense], '2026-03-10', {});

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0]?.key, 'transport-120');
  assert.match(alerts[0]?.body ?? '', /1,250/);
});

test('buildBudgetAlerts skips alerts already sent today', () => {
  const alerts = buildBudgetAlerts([budget], [expense], '2026-03-10', { 'transport-120': '2026-03-10' });
  assert.equal(alerts.length, 0);
});

test('buildDailyDigest respects the 7am threshold', () => {
  const beforeSeven = buildDailyDigest([], [expense], [budget], [], new Date('2026-03-10T03:45:00.000Z'));
  const afterSeven = buildDailyDigest([], [expense], [budget], [], new Date('2026-03-10T08:15:00.000Z'));

  assert.equal(beforeSeven, null);
  assert.ok(afterSeven);
  assert.match(afterSeven?.title ?? '', /digest/i);
});
