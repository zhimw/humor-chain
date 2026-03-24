import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.almostcrackd.ai';

/**
 * POST /api/test-flavor/presigned-url
 *
 * Body: { contentType: string }
 * Returns: { presignedUrl: string, cdnUrl: string }
 *
 * Gets a presigned S3 URL so the browser can PUT a file directly.
 * The JWT is kept server-side — never exposed to the client.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single();

  if (!profile || (!profile.is_superadmin && !profile.is_matrix_admin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 });
  }

  const body = await request.json();
  const { contentType } = body;

  if (!contentType) {
    return NextResponse.json({ error: 'contentType is required' }, { status: 400 });
  }

  const res = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ contentType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.message ?? err?.error ?? `Failed to get presigned URL (${res.status})` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
