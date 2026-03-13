import { format, parseISO } from 'date-fns';

export function safeDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const candidate = value instanceof Date ? value : parseISO(value);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

export function safeFormatDate(
  value: string | Date | null | undefined,
  pattern: string,
  fallback = 'Invalid date',
) {
  const candidate = safeDate(value);
  return candidate ? format(candidate, pattern) : fallback;
}
