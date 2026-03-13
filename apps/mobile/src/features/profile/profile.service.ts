import { supabase } from '../../lib/supabase';
import type { Profile, UpdateProfileInput } from '@personal-os/types';

async function ensureProfileRow(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const profileService = {
  getProfile: async (userId: string): Promise<Profile> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      // If profile row is missing for legacy users, create it lazily.
      if (error.code === 'PGRST116') {
        return ensureProfileRow(userId);
      }
      throw error;
    }
    return data;
  },

  updateProfile: async (userId: string, input: UpdateProfileInput): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...input }, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  uploadAvatar: async (userId: string, uri: string): Promise<string> => {
    const fileExtension = uri.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
    const contentType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
    const filePath = `${userId}/avatar-${Date.now()}.${fileExtension}`;
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, { contentType, upsert: true });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    await profileService.updateProfile(userId, { avatar_url: publicUrl });
    return publicUrl;
  },
};
