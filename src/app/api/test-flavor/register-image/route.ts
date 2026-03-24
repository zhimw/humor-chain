import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.almostcrackd.ai';

/**
 * POST /api/test-flavor/register-image
 * Body: { imageUrl: string }
 * Returns: { imageId: string }
 *
 * Registers an image URL with the pipeline API and returns its imageId.
 * JWT is kept server-side and never exposed to the browser.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'No session' }, { status: 401 });

  const { imageUrl } = await request.json();
  if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });

  const res = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ imageUrl, isCommonUse: false }),
  });

  const raw = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { rawResponse: raw };
  }

  if (!res.ok) {
    return NextResponse.json(
      {
        error: (data?.message as string) ?? (data?.error as string) ?? `Register failed (${res.status})`,
        statusCode: res.status,
        detail: data,
      },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
