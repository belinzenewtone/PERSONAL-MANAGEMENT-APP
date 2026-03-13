export function formatKES(value: number, options?: { compact?: boolean; decimals?: number }) {
  const compact = options?.compact ?? false;
  const decimals = options?.decimals ?? (compact ? 1 : 2);

  return `KES ${value.toLocaleString('en-KE', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals,
    minimumFractionDigits: compact ? 0 : decimals,
  })}`;
}
