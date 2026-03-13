export const fmtCurrency = (value: number) =>
  'KES ' + value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const KIND_ICON: Record<string, string> = {
  received: 'arrow-down-circle-outline',
  deposit: 'arrow-down-circle-outline',
  sent: 'arrow-up-circle-outline',
  buy_goods: 'cart-outline',
  paybill: 'business-outline',
  airtime: 'phone-portrait-outline',
  withdraw: 'cash-outline',
  reversal: 'return-up-back-outline',
  unknown: 'help-circle-outline',
};

export type SmsImportStep = 'idle' | 'scanning' | 'preview' | 'importing' | 'done';
