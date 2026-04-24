import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component — cookies are read-only there
          }
        },
      },
    }
  );
}

export type Profile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_superadmin: boolean;
  is_matrix_admin: boolean;
};

export async function requireToolAccess() {
  const supabase = createClient();

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];
  let userError: Awaited<ReturnType<typeof supabase.auth.getUser>>['error'];

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    userError = result.error;
  } catch (e) {
    // Network-level failure (fetch failed, DNS error, etc.) — do not wipe the
    // session by redirecting to the login page; surface a 503-style error instead.
    console.error('[requireToolAccess] getUser network error:', e);
    throw new Error('Unable to reach the auth service. Please refresh the page.');
  }

  if (userError) {
    // Auth-specific errors (invalid JWT, expired token with no refresh, etc.)
    // For these we do want to send the user back to the login gate.
    redirect('/');
  }

  if (!user) {
    redirect('/');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/');
  }

  if (!profile.is_superadmin && !profile.is_matrix_admin) {
    redirect('/');
  }

  return { supabase, user, profile: profile as Profile };
}
