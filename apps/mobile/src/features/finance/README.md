# Finance

Purpose: transactions, budgets, M-Pesa SMS import, and finance analytics/import workflows.

Main components:
- `components/FinanceScreen.tsx`
- `components/FinanceTransactionFormModal.tsx`
- `budget.hooks.ts`
- `finance.hooks.ts`
- `sms-import.service.ts`

Dependencies and integration points:
- Uses Supabase-backed finance and budget services
- Shares `SmsImportModal` from `src/components/finance`
- Supplies finance data to Home and Insights
