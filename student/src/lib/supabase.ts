import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ptrhfjfskzvoblrnuhrl.supabase.co',
  'sb_publishable_0Vowy9xnaCbVkKKzG7Z_DA_mIgncXA2',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // On the web, the email-confirmation and password-reset links land back
      // on the site with the session in the URL — the client must read it.
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);

/** Where Supabase should send people after they tap a link in an email. */
export function authRedirectUrl(): string | undefined {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return undefined;
}
