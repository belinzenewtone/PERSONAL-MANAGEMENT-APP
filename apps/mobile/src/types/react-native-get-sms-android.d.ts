declare module 'react-native-get-sms-android' {
  interface SmsFilter {
    box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued';
    minDate?: number;
    maxDate?: number;
    address?: string;
    body?: string;
    read?: 0 | 1;
    maxCount?: number;
  }

  const SmsAndroid: {
    list(
      filter: string,
      onError: (error: string) => void,
      onSuccess: (count: number, smsList: string) => void,
    ): void;
  };

  export default SmsAndroid;
}
