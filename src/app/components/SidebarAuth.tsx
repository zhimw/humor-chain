'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SidebarAuth() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    setLoading(true);
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  if (!email) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-dim)',
          padding: '0 2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={email}
      >
        {email}
      </div>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="button-secondary button-sm"
        style={{ width: '100%' }}
      >
        {loading ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}
