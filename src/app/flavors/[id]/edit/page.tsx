import { requireToolAccess } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditFlavorForm from './EditFlavorForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function EditFlavorPage({ params }: Props) {
  const { supabase } = await requireToolAccess();

  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const { data: flavor, error } = await supabase
    .from('humor_flavors')
    .select('id, slug, description')
    .eq('id', id)
    .single();

  if (error || !flavor) notFound();

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="page-title">Edit Flavor</h1>
          <p className="page-subtitle">
            Slug: <span className="badge badge-primary mono">{flavor.slug}</span>
          </p>
        </div>
        <a href="/flavors" className="button-secondary">
          ← Back to Flavors
        </a>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <EditFlavorForm flavor={flavor} />
      </div>
    </div>
  );
}
