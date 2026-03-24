import { requireToolAccess } from '@/lib/supabase/server';
import Link from 'next/link';
import FlavorCreateModal from './FlavorCreateModal';
import FlavorDeleteButton from './FlavorDeleteButton';

export const dynamic = 'force-dynamic';

export default async function FlavorsPage() {
  const { supabase } = await requireToolAccess();

  const { data: flavors, error } = await supabase
    .from('humor_flavors')
    .select(
      `
      id,
      slug,
      description,
      created_datetime_utc,
      humor_flavor_steps(id)
    `
    )
    .order('created_datetime_utc', { ascending: false });

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">Failed to load flavors: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="page-title">Humor Flavors</h1>
          <p className="page-subtitle">
            Manage flavor slugs and their LLM prompt chain steps
          </p>
        </div>
        <FlavorCreateModal />
      </div>

      {!flavors || flavors.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🌶️</div>
            <div className="empty-state-title">No flavors yet</div>
            <div className="empty-state-body">
              Click &quot;+ New Flavor&quot; to create your first humor flavor.
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Description</th>
                <th>Steps</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flavors.map((flavor) => {
                const stepCount = Array.isArray(flavor.humor_flavor_steps)
                  ? flavor.humor_flavor_steps.length
                  : 0;
                return (
                  <tr key={flavor.id}>
                    <td>
                      <span className="badge badge-primary mono">{flavor.slug}</span>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <span className="text-muted text-sm">
                        {flavor.description || (
                          <em style={{ color: 'var(--text-dim)' }}>No description</em>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="badge">
                        {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                      </span>
                    </td>
                    <td className="text-sm text-muted">
                      {new Date(flavor.created_datetime_utc).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          href={`/flavors/${flavor.id}/edit`}
                          className="button-secondary button-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/flavors/${flavor.id}/steps`}
                          className="button-secondary button-sm"
                        >
                          Steps
                        </Link>
                        <Link
                          href={`/flavors/${flavor.id}/captions`}
                          className="button-ghost button-sm"
                        >
                          Captions
                        </Link>
                        <FlavorDeleteButton id={flavor.id} stepCount={stepCount} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
