import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import {
  importMpesaSms,
  commitImport,
  SmsImportResult,
} from './sms-import.service';
import { ParsedMpesaSms } from './mpesa-parser';

export function useImportMpesaSms() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<SmsImportResult, Error, { daysBack?: number }>({
    mutationFn: async ({ daysBack = 30 }) => {
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
