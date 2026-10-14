import type { User } from '@supabase/supabase-js';
import { useStore } from '../store/useStore';
import { useParentStore } from '../store/useParentStore';
import { getProfile, ensureProfile, Profile } from './db';
import { registerPush } from './push';

/**
 * Puts a signed-in user into the right part of the app. Used at launch, right
 * after sign-in, and when someone lands back from an email-confirmation link.
 *
 * - The server profile decides the role (the sign-in screen never guesses).
 * - A different account than last time on this device starts from a clean slate,
 *   then everything the account saved (classes, points, code…) is restored.
 * - Students who haven't finished setup go to the setup steps.
 */
export async function enterApp(user: User): Promise<void> {
  const metaRole: 'student' | 'parent' = user.user_metadata?.role === 'parent' ? 'parent' : 'student';
  const metaName = String(user.user_metadata?.display_name ?? '').trim() || (user.email ?? '').split('@')[0];

  let profile: Profile | null = null;
  let offline = false;
  try {
    profile = await getProfile(user.id);
    if (!profile) {
      await ensureProfile(user.id, metaRole, metaName);
      profile = await getProfile(user.id);
    }
  } catch {
    offline = true;
  }

  const st = useStore.getState();
  const role = profile?.role ?? (st.userId === user.id ? st.userRole : metaRole);
  const name = profile?.display_name || metaName;

  if (user.id !== st.userId) {
    st.resetForUser(user.id, role, name, user.email ?? '');
  } else {
    useStore.setState({ email: user.email ?? st.email, userRole: role });
  }
  if (profile) useStore.getState().applyProfile(profile);

  if (role === 'parent') {
    useParentStore.getState().ensureOwner(user.id);
    useStore.getState().setPhase('parent');
  } else {
    const s = useStore.getState();
    s.setPhase(s.onboarded ? 'main' : 'onboarding');
    if (!offline) s.loadDataFromSupabase().catch(() => {});
  }

  registerPush(user.id).catch(() => {});
}
