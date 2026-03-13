import { getErrorMessage } from './error-handler';
import { isSupabaseConfigured, supabase } from './supabase';

type TelemetryLevel = 'info' | 'warning' | 'error';

interface TelemetryPayload {
  scope: string;
  message: string;
  level?: TelemetryLevel;
  metadata?: Record<string, unknown>;
}

export async function captureTelemetryEvent({
  scope,
  message,
  level = 'info',
  metadata,
}: TelemetryPayload): Promise<void> {
  const payload = {
    scope,
    message,
    level,
    metadata: metadata ?? null,
    created_at: new Date().toISOString(),
  };

  if (__DEV__) {
    console[level === 'error' ? 'error' : 'log']('[telemetry]', payload);
  }

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('app_client_events').insert({
      ...payload,
      user_id: user?.id ?? null,
    });
  } catch {
    // Telemetry should never break the app.
  }
}

export async function captureErrorEvent(scope: string, error: unknown, metadata?: Record<string, unknown>) {
  await captureTelemetryEvent({
    scope,
    level: 'error',
    message: getErrorMessage(error),
    metadata,
  });
}
