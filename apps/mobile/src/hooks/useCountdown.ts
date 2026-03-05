import { useState, useEffect } from 'react';

export type CountdownUrgency = 'overdue' | 'urgent' | 'soon' | 'normal';

export interface CountdownResult {
  label: string;
  urgency: CountdownUrgency;
}

/**
 * Returns a live countdown label and urgency level for a given target date.
 * Updates every 30 seconds. Returns empty label when targetDate is null.
 *
 * Urgency levels:
 *   overdue → past deadline
 *   urgent  → < 10 min remaining  (red)
 *   soon    → < 1 hr remaining    (amber)
 *   normal  → more than 1 hr left (muted)
 */
export function useCountdown(
  targetDate: string | Date | null | undefined,
): CountdownResult {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!targetDate) return { label: '', urgency: 'normal' };

  const target = new Date(targetDate).getTime();
  const diff   = target - now;

  if (diff <= 0) return { label: 'Overdue', urgency: 'overdue' };

  const totalSeconds  = Math.floor(diff / 1000);
  const totalMinutes  = Math.floor(totalSeconds / 60);
  const hours         = Math.floor(totalMinutes / 60);
  const minutes       = totalMinutes % 60;
  const days          = Math.floor(hours / 24);
  const remHours      = hours % 24;

  if (totalMinutes < 10) {
    return { label: `${totalMinutes}m left`, urgency: 'urgent' };
  }
  if (totalMinutes < 60) {
    return { label: `${totalMinutes}m left`, urgency: 'soon' };
  }
  if (hours < 24) {
    return {
      label: minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`,
      urgency: 'soon',
    };
  }
  return {
    label: remHours > 0 ? `${days}d ${remHours}h left` : `${days}d left`,
    urgency: 'normal',
  };
}
