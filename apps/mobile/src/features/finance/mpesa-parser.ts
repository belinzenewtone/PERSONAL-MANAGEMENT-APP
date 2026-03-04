/**
 * M-Pesa SMS Parser
 * Parses M-Pesa SMS messages from the official "MPESA" sender.
 * Handles: received, sent, buy-goods, paybill, withdraw, airtime, deposit.
 */

export type MpesaTransactionKind =
  | 'received'
  | 'sent'
  | 'buy_goods'
  | 'paybill'
  | 'withdraw'
  | 'airtime'
  | 'deposit'
  | 'reversal'
  | 'unknown';

export interface ParsedMpesaSms {
  mpesa_code: string;
  amount: number;
  kind: MpesaTransactionKind;
  /** 'income' for received/deposit/reversal, 'expense' for everything else */
  transaction_type: 'income' | 'expense';
  category: string;
  description: string;
  counterparty: string | null;
  balance: number | null;
  date: Date;
  raw: string;
}

export interface SmsParseError {
  raw: string;
  reason: string;
  timestamp: Date;
}

// ─── Regexes ──────────────────────────────────────────────────────────────────

// Transaction code: 10 alphanumeric chars at start
const CODE_RE = /^([A-Z0-9]{10})\b/;

// Amount: "Ksh1,234.00" or "KES 1,234.00" or "Ksh1234"
const AMOUNT_RE = /Ksh([\d,]+(?:\.\d{2})?)/i;

// Balance: "New M-PESA balance is Ksh1,234.00"
const BALANCE_RE = /(?:New M-PESA balance is|balance is)\s*Ksh([\d,]+(?:\.\d{2})?)/i;

// Date/time in SMS: "1/3/26 at 9:00 AM" or "1/3/2026 at 9:00 AM"
const DATE_RE = /(\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s+at\s+(\d{1,2}:\d{2}\s*[AP]M))?/i;

// Patterns for each transaction type
const PATTERNS: { kind: MpesaTransactionKind; re: RegExp }[] = [
  // Received money: "Ksh100.00 received from NAME 0700000000"
  { kind: 'received',  re: /Ksh[\d,.]+ received from (.+?)(?:\.\s*New|\. on|\s+on\s)/i },
  // Deposit at agent: "Ksh100 deposited"
  { kind: 'deposit',   re: /Ksh[\d,.]+ deposited/i },
  // Airtime: "sent to 07... for airtime" or "for airtime purchase"
  { kind: 'airtime',   re: /for airtime(?:\s+purchase)?/i },
  // Paybill: "sent to MERCHANT PAYBILL account"
  { kind: 'paybill',   re: /sent to (.+?) account\s+([\w\d]+)/i },
  // Buy goods: "paid to MERCHANT"
  { kind: 'buy_goods', re: /paid to (.+?) on\s/i },
  // Withdraw: "withdrawn from agent"
  { kind: 'withdraw',  re: /withdrawn from agent/i },
  // Reversal
  { kind: 'reversal',  re: /transaction of Ksh[\d,.]+ has been reversed/i },
  // Sent: "sent to NAME 0700000000 on"
  { kind: 'sent',      re: /sent to (.+?) on\s/i },
];

const KIND_TO_CATEGORY: Record<MpesaTransactionKind, string> = {
  received:  'M-Pesa Received',
  deposit:   'M-Pesa Received',
  airtime:   'Airtime',
  paybill:   'Utilities',
  buy_goods: 'Shopping',
  withdraw:  'Cash Withdrawal',
  reversal:  'M-Pesa Received',
  sent:      'Transfer',
  unknown:   'Other',
};

const KIND_TO_TYPE: Record<MpesaTransactionKind, 'income' | 'expense'> = {
  received:  'income',
  deposit:   'income',
  reversal:  'income',
  airtime:   'expense',
  paybill:   'expense',
  buy_goods: 'expense',
  withdraw:  'expense',
  sent:      'expense',
  unknown:   'expense',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAmount(text: string): number | null {
  const m = AMOUNT_RE.exec(text);
  if (!m) return null;
  return parseFloat(m[1].replace(/,/g, ''));
}

function parseBalance(text: string): number | null {
  const m = BALANCE_RE.exec(text);
  if (!m) return null;
  return parseFloat(m[1].replace(/,/g, ''));
}

function parseSmsDate(text: string, smsTimestamp: number): Date {
  const m = DATE_RE.exec(text);
  if (!m) return new Date(smsTimestamp);
  try {
    const [dd, mm, yy] = m[1].split('/').map(Number);
    const year = yy < 100 ? 2000 + yy : yy;
    const base = new Date(year, mm - 1, dd);
    if (m[2]) {
      const timeMatch = /(\d{1,2}):(\d{2})\s*([AP]M)/i.exec(m[2]);
      if (timeMatch) {
        let h = parseInt(timeMatch[1]);
        const min = parseInt(timeMatch[2]);
        if (timeMatch[3].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (timeMatch[3].toUpperCase() === 'AM' && h === 12) h = 0;
        base.setHours(h, min, 0, 0);
      }
    }
    return base;
  } catch {
    return new Date(smsTimestamp);
  }
}

function extractCounterparty(body: string, kind: MpesaTransactionKind): string | null {
  try {
    if (kind === 'received') {
      const m = /received from (.+?)(?:\.\s*New|\. on|\s+New)/i.exec(body);
      return m ? m[1].trim() : null;
    }
    if (kind === 'buy_goods') {
      const m = /paid to (.+?) on\s/i.exec(body);
      return m ? m[1].trim() : null;
    }
    if (kind === 'paybill') {
      const m = /sent to (.+?) account/i.exec(body);
      return m ? m[1].trim() : null;
    }
    if (kind === 'airtime') {
      const m = /sent to ([\d+]+) for airtime/i.exec(body);
      return m ? m[1].trim() : null;
    }
    if (kind === 'sent') {
      const m = /sent to (.+?) on\s/i.exec(body);
      return m ? m[1].trim() : null;
    }
    if (kind === 'withdraw') {
      const m = /agent\s+\d+\s+(.+?)(?:\s+on|\.\s*New)/i.exec(body);
      return m ? m[1].trim() : null;
    }
  } catch { /* ignore */ }
  return null;
}

function buildDescription(kind: MpesaTransactionKind, counterparty: string | null, amount: number): string {
  switch (kind) {
    case 'received':  return counterparty ? `Received from ${counterparty}` : 'M-Pesa received';
    case 'deposit':   return 'Cash deposit';
    case 'airtime':   return counterparty ? `Airtime for ${counterparty}` : 'Airtime purchase';
    case 'paybill':   return counterparty ? `Paid to ${counterparty} (Paybill)` : 'Paybill payment';
    case 'buy_goods': return counterparty ? `Bought goods at ${counterparty}` : 'Buy Goods';
    case 'withdraw':  return counterparty ? `Withdrawal at ${counterparty}` : 'Cash withdrawal';
    case 'reversal':  return 'Transaction reversed';
    case 'sent':      return counterparty ? `Sent to ${counterparty}` : 'M-Pesa sent';
    default:          return `M-Pesa KES ${amount}`;
  }
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseMpesaSms(
  body: string,
  smsTimestamp: number,
): ParsedMpesaSms | SmsParseError {
  // Must come from valid M-Pesa format
  const codeMatch = CODE_RE.exec(body.trim());
  if (!codeMatch) {
    return { raw: body, reason: 'No transaction code found', timestamp: new Date(smsTimestamp) };
  }
  const mpesa_code = codeMatch[1];

  const amount = parseAmount(body);
  if (!amount || amount <= 0) {
    return { raw: body, reason: 'No valid amount found', timestamp: new Date(smsTimestamp) };
  }

  // Detect kind
  let kind: MpesaTransactionKind = 'unknown';
  for (const { kind: k, re } of PATTERNS) {
    if (re.test(body)) { kind = k; break; }
  }

  const balance     = parseBalance(body);
  const date        = parseSmsDate(body, smsTimestamp);
  const counterparty = extractCounterparty(body, kind);
  const description = buildDescription(kind, counterparty, amount);

  return {
    mpesa_code,
    amount,
    kind,
    transaction_type: KIND_TO_TYPE[kind],
    category: KIND_TO_CATEGORY[kind],
    description,
    counterparty,
    balance,
    date,
    raw: body,
  };
}

export function isParsedSms(result: ParsedMpesaSms | SmsParseError): result is ParsedMpesaSms {
  return 'mpesa_code' in result;
}
