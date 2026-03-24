import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.almostcrackd.ai';

async function getAuthorizedSession() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single();

  if (!profile || (!profile.is_superadmin && !profile.is_matrix_admin)) return null;

  // Get the session for the JWT access token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

/**
 * POST /api/test-flavor
 *
 * Body: { imageUrl: string, humor_flavor_id: number }
 *
 * Flow:
 *   1. Register the image URL via POST /pipeline/upload-image-from-url → { imageId }
 *   2. Generate captions via POST /pipeline/generate-captions → captions[]
 */
export async function POST(request: Request) {
  const session = await getAuthorizedSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jwt = session.access_token;

  const body = await request.json();
  const { imageUrl, humor_flavor_id } = body;

  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
  }

  // Step 1: Register the image URL to get an imageId
  const registerRes = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ imageUrl, isCommonUse: false }),
  });

  if (!registerRes.ok) {
    const err = await registerRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.message ?? err?.error ?? `Failed to register image (${registerRes.status})` },
      { status: registerRes.status }
    );
  }

  const { imageId } = await registerRes.json();

  if (!imageId) {
    return NextResponse.json(
      { error: 'API did not return an imageId after image registration.' },
      { status: 500 }
    );
  }

  // Step 2: Generate captions with the imageId (and humor_flavor_id if supported)
  const captionPayload: Record<string, unknown> = { imageId };
  if (humor_flavor_id) captionPayload.humor_flavor_id = humor_flavor_id;

  const captionRes = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(captionPayload),
  });

  if (!captionRes.ok) {
    const err = await captionRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.message ?? err?.error ?? `Caption generation failed (${captionRes.status})` },
      { status: captionRes.status }
    );
  }

  const captionData = await captionRes.json();
  return NextResponse.json(captionData);
}
