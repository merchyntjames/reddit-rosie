import { createClient } from '@/utils/supabase/client';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  initials: string;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return null;

    const email = user.email;
    // Derive display name from email (james@merchynt.com → James)
    const namePart = email.split('@')[0];
    const displayName = namePart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    const initials = displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      id: user.id,
      email,
      displayName,
      initials,
    };
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/login';
}
