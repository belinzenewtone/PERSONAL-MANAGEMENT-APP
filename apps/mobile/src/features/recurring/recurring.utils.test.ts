import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextRecurringRun } from './recurring.utils';

test('getNextRecurringRun advances daily templates by one day', () => {
  assert.equal(
    getNextRecurringRun('2026-03-10T09:00:00.000Z', 'daily'),
    '2026-03-11T09:00:00.000Z',
  );
});

test('getNextRecurringRun advances monthly templates by one month', () => {
  assert.equal(
    getNextRecurringRun('2026-03-10T09:00:00.000Z', 'monthly'),
    '2026-04-10T09:00:00.000Z',
  );
});
