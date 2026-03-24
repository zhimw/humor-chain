import { requireToolAccess } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StepsManager from './StepsManager';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function StepsPage({ params }: Props) {
  const { supabase } = await requireToolAccess();

  const flavorId = parseInt(params.id, 10);
  if (isNaN(flavorId)) notFound();

  const [flavorResult, stepsResult, modelsResult, inputTypesResult, outputTypesResult, stepTypesResult] =
    await Promise.all([
      supabase
        .from('humor_flavors')
        .select('id, slug, description')
        .eq('id', flavorId)
        .single(),
      supabase
        .from('humor_flavor_steps')
        .select(
          `
          id,
          order_by,
          llm_temperature,
          description,
          llm_system_prompt,
          llm_user_prompt,
          llm_model_id,
          llm_input_type_id,
          llm_output_type_id,
          humor_flavor_step_type_id,
          llm_models(id, name, is_temperature_supported),
          llm_input_types(id, slug, description),
          llm_output_types(id, slug, description),
          humor_flavor_step_types(id, slug, description)
        `
        )
        .eq('humor_flavor_id', flavorId)
        .order('order_by', { ascending: true }),
      supabase
        .from('llm_models')
        .select('id, name, is_temperature_supported')
        .order('name'),
      supabase
        .from('llm_input_types')
        .select('id, slug, description')
        .order('slug'),
      supabase
        .from('llm_output_types')
        .select('id, slug, description')
        .order('slug'),
      supabase
        .from('humor_flavor_step_types')
        .select('id, slug, description')
        .order('slug'),
    ]);

  if (flavorResult.error || !flavorResult.data) notFound();

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="page-title">Prompt Chain Steps</h1>
          <p className="page-subtitle">
            Flavor:{' '}
            <span className="badge badge-primary mono">
              {flavorResult.data.slug}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link
            href={`/flavors/${flavorId}/test`}
            className="button-secondary"
          >
            🧪 Test Flavor
          </Link>
          <Link href="/flavors" className="button-secondary">
            ← Back
          </Link>
        </div>
      </div>

      <StepsManager
        flavorId={flavorId}
        steps={stepsResult.data ?? []}
        models={modelsResult.data ?? []}
        inputTypes={inputTypesResult.data ?? []}
        outputTypes={outputTypesResult.data ?? []}
        stepTypes={stepTypesResult.data ?? []}
      />
    </div>
  );
}
