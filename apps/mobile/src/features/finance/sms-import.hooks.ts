import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import {
  requestSmsPermission,
  importMpesaSms,
  commitImport,
  SmsImportResult,
} from './sms-import.service';
import { ParsedMpesaSms } from './mpesa-parser';

export function useImportMpesaSms() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<SmsImportResult, Error, { daysBack?: number }>({
    mutationFn: async ({ daysBack = 30 }) => {
      const granted = await requestSmsPermission();
      if (!granted) throw new Error('SMS permission denied. Please grant READ_SMS permission in your device settings.');
      return importMpesaSms(userId!, daysBack);
    },
  });
}

export function useCommitImport() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<void, Error, ParsedMpesaSms[]>({
    mutationFn: (items) => commitImport(userId!, items),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['transactions', userId] }),
  });
}
