import { requireToolAccess } from '@/lib/supabase/server';
import FlavorCreateModal from './FlavorCreateModal';
import FlavorsTable, { type FlavorRow } from './FlavorsTable';

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
      humor_flavor_steps(id),
      profiles!created_by_user_id(first_name, last_name, email)
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
        <FlavorsTable flavors={flavors as unknown as FlavorRow[]} />
      )}
    </div>
  );
}
