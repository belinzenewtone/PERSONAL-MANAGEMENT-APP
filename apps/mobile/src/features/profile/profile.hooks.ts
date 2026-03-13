import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { profileService } from './profile.service';
import type { UpdateProfileInput } from '@personal-os/types';

const PROFILE_KEYS = {
  current: (userId: string) => ['profile', userId] as const,
};

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: PROFILE_KEYS.current(userId!),
    queryFn: () => profileService.getProfile(userId!),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileService.updateProfile(userId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.current(userId!) }),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (uri: string) => profileService.uploadAvatar(userId!, uri),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.current(userId!) }),
  });
}
