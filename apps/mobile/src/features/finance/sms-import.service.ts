import { Platform, PermissionsAndroid } from 'react-native';
import { supabase } from '../../lib/supabase';
import { parseMpesaSms, isParsedSms, ParsedMpesaSms, SmsParseError } from './mpesa-parser';

// Lazy-load the native module to prevent crash on iOS / Expo Go
let SmsAndroid: any = null;
try {
  if (Platform.OS === 'android') {
    SmsAndroid = require('react-native-get-sms-android').default;
  }
} catch {
  // Not available in Expo Go – silently ignore
}

export interface RawSms {
  _id:    string;
  address: string;
  body:    string;
  date:    string; // unix ms as string
}

export interface SmsImportResult {
  imported:  ParsedMpesaSms[];
  skipped:   number;  // duplicates
  errors:    SmsParseError[];
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);
    return (
      result[PermissionsAndroid.PERMISSIONS.READ_SMS]    === 'granted' &&
      result[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === 'granted'
    );
  } catch {
    return false;
  }
}

export async function checkSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
  } catch {
    return false;
  }
}

// ─── SMS Reading ──────────────────────────────────────────────────────────────

/** Read all SMS from "MPESA" sender in the last N days */
export function readMpesaSms(daysBack = 30): Promise<RawSms[]> {
  return new Promise((resolve, reject) => {
    if (!SmsAndroid) {
      reject(new Error('SMS reading is only available in a development/production build (not Expo Go).'));
      return;
    }

    const minDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    SmsAndroid.list(
      JSON.stringify({
        box:     'inbox',
        address: 'MPESA',
        minDate,
        maxCount: 500,
      }),
      (err: string) => reject(new Error(err)),
      (_count: number, smsList: string) => {
        try {
          resolve(JSON.parse(smsList) as RawSms[]);
        } catch (e) {
          reject(e);
        }
      },
    );
  });
}

// ─── Duplicate check ──────────────────────────────────────────────────────────

async function getExistingCodes(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('transactions')
    .select('mpesa_code')
    .eq('user_id', userId)
    .not('mpesa_code', 'is', null);
  return new Set((data ?? []).map((r: { mpesa_code: string }) => r.mpesa_code));
}

// ─── Error logging ────────────────────────────────────────────────────────────

async function logParseErrors(userId: string, errors: SmsParseError[]): Promise<void> {
  if (errors.length === 0) return;
  await supabase.from('sms_parse_errors').insert(
    errors.map((e) => ({
      user_id:   userId,
      raw_body:  e.raw,
      reason:    e.reason,
      failed_at: e.timestamp.toISOString(),
    }))
  );
}

// ─── Main import function ─────────────────────────────────────────────────────

export async function importMpesaSms(
  userId: string,
  daysBack = 30,
): Promise<SmsImportResult> {
  const smsList = await readMpesaSms(daysBack);
  const existingCodes = await getExistingCodes(userId);

  const parsed:   ParsedMpesaSms[] = [];
  const errors:   SmsParseError[]  = [];
  let   skipped = 0;

  for (const sms of smsList) {
    const result = parseMpesaSms(sms.body, Number(sms.date));
    if (!isParsedSms(result)) {
      errors.push(result);
      continue;
    }
    if (existingCodes.has(result.mpesa_code)) {
      skipped++;
      continue;
    }
    parsed.push(result);
    existingCodes.add(result.mpesa_code); // prevent in-batch dupes
  }

  // Log errors async (don't await — non-blocking)
  logParseErrors(userId, errors).catch(() => {});

  return { imported: parsed, skipped, errors };
}

/** Bulk-insert confirmed parsed transactions */
export async function commitImport(
  userId: string,
  items: ParsedMpesaSms[],
): Promise<void> {
  if (items.length === 0) return;
  const rows = items.map((p) => ({
    user_id:          userId,
    amount:           p.amount,
    type:             p.transaction_type,
    category:         p.category,
    description:      p.description,
    source:           'mpesa' as const,
    mpesa_code:       p.mpesa_code,
    auto_imported:    true,
    transaction_date: p.date.toISOString(),
  }));
  const { error } = await supabase.from('transactions').insert(rows);
  if (error) throw error;
}
