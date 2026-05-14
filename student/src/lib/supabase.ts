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
      detectSessionInUrl: false,
    },
  }
);
