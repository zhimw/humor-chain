import { requireToolAccess } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CaptionImage from './CaptionImage';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

interface Props {
  params: { id: string };
  searchParams: { page?: string; view?: string };
}

export default async function CaptionsPage({ params, searchParams }: Props) {
  const { supabase } = await requireToolAccess();

  const flavorId = parseInt(params.id, 10);
  if (isNaN(flavorId)) notFound();

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const view = searchParams.view === 'table' ? 'table' : 'gallery';
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [flavorResult, captionsResult] = await Promise.all([
    supabase
      .from('humor_flavors')
      .select('id, slug')
      .eq('id', flavorId)
      .single(),
    supabase
      .from('captions')
      .select(
        `id, content, like_count, is_public, is_featured, created_datetime_utc,
         images(id, url)`,
        { count: 'exact' }
      )
      .eq('humor_flavor_id', flavorId)
      .order('created_datetime_utc', { ascending: false })
      .range(from, to),
  ]);

  if (flavorResult.error || !flavorResult.data) notFound();

  const flavor = flavorResult.data;
  const captions = captionsResult.data ?? [];
  const total = captionsResult.count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function getImageUrl(caption: typeof captions[number]): string | null {
    const img = caption.images;
    if (!img) return null;
    const record = Array.isArray(img) ? img[0] : img;
    return (record as { url?: string | null })?.url ?? null;
  }

  const pagination = totalPages > 1 ? (
    <div className="pagination">
      {page > 1 && (
        <Link href={`/flavors/${flavorId}/captions?page=${page - 1}&view=${view}`} className="button-secondary button-sm">
          ← Previous
        </Link>
      )}
      <span className="pagination-info">Page {page} of {totalPages}</span>
      {page < totalPages && (
        <Link href={`/flavors/${flavorId}/captions?page=${page + 1}&view=${view}`} className="button-secondary button-sm">
          Next →
        </Link>
      )}
    </div>
  ) : null;

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="page-title">Captions</h1>
          <p className="page-subtitle">
            Flavor:{' '}
            <span className="badge badge-primary mono">{flavor.slug}</span>
            {' · '}
            <span className="text-muted">{total} total</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '3px', gap: '2px' }}>
            <Link
              href={`/flavors/${flavorId}/captions?page=1&view=gallery`}
              className={view === 'gallery' ? 'button button-sm' : 'button-ghost button-sm'}
              style={{ textDecoration: 'none' }}
            >
              ⊞ Gallery
            </Link>
            <Link
              href={`/flavors/${flavorId}/captions?page=1&view=table`}
              className={view === 'table' ? 'button button-sm' : 'button-ghost button-sm'}
              style={{ textDecoration: 'none' }}
            >
              ☰ Table
            </Link>
          </div>
          <Link href={`/flavors/${flavorId}/test`} className="button-secondary">
            🧪 Test Flavor
          </Link>
          <Link href="/flavors" className="button-secondary">
            ← Back
          </Link>
        </div>
      </div>

      {captions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">No captions yet</div>
            <div className="empty-state-body">
              <Link href={`/flavors/${flavorId}/test`}>Test this flavor</Link> to generate captions.
            </div>
          </div>
        </div>
      ) : view === 'gallery' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {captions.map((caption) => {
              const imgUrl = getImageUrl(caption);
              return (
                <div key={caption.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  {/* Image */}
                  <div style={{ borderBottom: '1px solid var(--border)' }}>
                    {imgUrl ? (
                      <CaptionImage src={imgUrl} height={180} />
                    ) : (
                      <div style={{ width: '100%', height: '80px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '24px', opacity: 0.3 }}>🖼️</span>
                      </div>
                    )}
                  </div>

                  {/* Caption text */}
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '12px' }}>
                      {caption.content ?? <em style={{ color: 'var(--text-dim)' }}>No content</em>}
                    </p>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge">❤️ {caption.like_count ?? 0}</span>
                      <span className={caption.is_public ? 'badge badge-success' : 'badge'}>
                        {caption.is_public ? 'Public' : 'Private'}
                      </span>
                      {caption.is_featured && (
                        <span className="badge badge-warning">⭐ Featured</span>
                      )}
                      <span className="text-xs text-dim" style={{ marginLeft: 'auto' }}>
                        {new Date(caption.created_datetime_utc).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {pagination}
        </>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Image</th>
                  <th>Caption</th>
                  <th>Likes</th>
                  <th>Public</th>
                  <th>Featured</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {captions.map((caption) => {
                  const imgUrl = getImageUrl(caption);
                  return (
                    <tr key={caption.id}>
                      <td>
                        {imgUrl ? (
                          <CaptionImage
                            src={imgUrl}
                            height={48}
                            style={{ width: '64px', borderRadius: '6px', border: '1px solid var(--border)' }}
                          />
                        ) : (
                          <div style={{ width: '64px', height: '48px', background: 'var(--surface-2)', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', opacity: 0.4 }}>
                            🖼️
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="text-sm">{caption.content ?? '—'}</span>
                      </td>
                      <td>
                        <span className="badge">❤️ {caption.like_count ?? 0}</span>
                      </td>
                      <td>
                        <span className={caption.is_public ? 'badge badge-success' : 'badge'}>
                          {caption.is_public ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td>
                        {caption.is_featured
                          ? <span className="badge badge-warning">⭐ Featured</span>
                          : <span className="text-dim text-sm">—</span>
                        }
                      </td>
                      <td className="text-sm text-muted">
                        {new Date(caption.created_datetime_utc).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination}
        </>
      )}
    </div>
  );
}
