import { captureErrorEvent } from './telemetry';

export async function unwrapFunctionsHttpError(error: unknown): Promise<never> {
  const context = (error as { context?: Response })?.context;
  if (!context) {
    captureErrorEvent('edge-function', error).catch(() => {});
    throw error;
  }

  let payload: unknown;
  let textPayload: string | null = null;

  try {
    payload = await context.clone().json();
  } catch {
    try {
      textPayload = await context.clone().text();
    } catch {
      textPayload = null;
    }
  }

  const payloadMessage =
    typeof payload === 'object' && payload !== null
      ? String(
          (payload as { error?: unknown; message?: unknown; msg?: unknown }).error ??
          (payload as { error?: unknown; message?: unknown; msg?: unknown }).message ??
          (payload as { error?: unknown; message?: unknown; msg?: unknown }).msg ??
          ''
        )
      : '';

  const message =
    payloadMessage ||
    textPayload ||
    `Edge Function failed with status ${context.status}`;

  const isAuthError =
    (context.status === 401 && /invalid jwt/i.test(message)) ||
    (context.status === 400 && /unauthenticated/i.test(message));

  if (isAuthError) {
    captureErrorEvent('edge-function', message, {
      status: context.status,
      payload: payload ?? textPayload,
    }).catch(() => {});
    throw new Error('Edge function authentication failed. Please refresh and try again.');
  }

  captureErrorEvent('edge-function', message, {
    status: context.status,
    payload: payload ?? textPayload,
  }).catch(() => {});

  throw new Error(message);
}
