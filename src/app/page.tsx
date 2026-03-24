import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="gate-page">
        <div className="gate-card">
          <div className="gate-icon">⛓</div>
          <h1 className="gate-title">Prompt Chain Tool</h1>
          <p className="gate-body">
            Sign in to manage humor flavors and LLM prompt chain steps.
          </p>
          <a href="/api/auth/signin" className="button" style={{ width: '100%' }}>
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  // Fetch profile to check authorization
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single();

  if (!profile || (!profile.is_superadmin && !profile.is_matrix_admin)) {
    return (
      <div className="gate-page">
        <div className="gate-card">
          <div
            className="gate-icon"
            style={{ background: 'rgba(239,68,68,0.15)', fontSize: '28px' }}
          >
            🚫
          </div>
          <h1 className="gate-title">Access Denied</h1>
          <p className="gate-body">
            <strong>{profile?.email ?? user.email}</strong> does not have
            permission to access this tool.
            <br />
            <br />
            Please contact a superadmin to get your account upgraded to{' '}
            <code>is_superadmin</code> or <code>is_matrix_admin</code>.
          </p>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="button-danger" style={{ width: '100%' }}>
              Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  redirect('/flavors');
}
