import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.almostcrackd.ai';

/**
 * POST /api/test-flavor/generate-captions
 * Body: { imageId: string, humor_flavor_id: number }
 * Returns: captions[]
 *
 * Calls POST /pipeline/generate-captions on the external API.
 * JWT is kept server-side.
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

  const { imageId, humor_flavor_id } = await request.json();
  if (!imageId) return NextResponse.json({ error: 'imageId is required' }, { status: 400 });

  // Build payload — try both snake_case and camelCase for humor flavor id
  const payload: Record<string, unknown> = { imageId };
  if (humor_flavor_id != null) {
    payload.humor_flavor_id = humor_flavor_id;
    payload.humorFlavorId = humor_flavor_id;
  }

  const res = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { rawResponse: raw };
  }

  if (!res.ok) {
    const d = data as Record<string, unknown>;
    return NextResponse.json(
      {
        error: (d?.message as string) ?? (d?.error as string) ?? `Caption generation failed (${res.status})`,
        statusCode: res.status,
        detail: d,
      },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
