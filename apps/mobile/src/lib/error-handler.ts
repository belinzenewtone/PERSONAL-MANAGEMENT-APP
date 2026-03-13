/**
 * Centralized error handler.
 * Extracts a human-readable message from any error type
 * and optionally maps Supabase/network codes to friendly strings.
 */

const SUPABASE_MESSAGES: Record<string, string> = {
  'Invalid login credentials':         'Wrong email or password.',
  'Email not confirmed':               'Please verify your email first.',
  'User already registered':           'An account with this email already exists.',
  'Password should be at least 6':     'Password must be at least 6 characters.',
  'JWT expired':                       'Your session expired. Please sign in again.',
  '23505':                             'This record already exists (duplicate).',
  'Failed to fetch':                   'No internet connection. Please check your network.',
  'Network request failed':            'No internet connection. Please check your network.',
};

export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred.';

  if (typeof error === 'string') return mapMessage(error);

  if (error instanceof Error) {
    const msg = error.message;
    // Check for known patterns
    for (const [key, friendly] of Object.entries(SUPABASE_MESSAGES)) {
      if (msg.includes(key)) return friendly;
    }
    return msg || 'Something went wrong.';
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, any>;
    const msg = obj.message ?? obj.error_description ?? obj.msg ?? obj.error ?? '';
    return mapMessage(String(msg));
  }

  return 'Something went wrong.';
}

function mapMessage(msg: string): string {
  for (const [key, friendly] of Object.entries(SUPABASE_MESSAGES)) {
    if (msg.includes(key)) return friendly;
  }
  return msg || 'Something went wrong.';
}

/** Returns true if the error is a network/offline error */
export function isNetworkError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return msg.includes('network') || msg.includes('fetch') || msg.includes('internet');
}
