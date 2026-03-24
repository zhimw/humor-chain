import { requireToolAccess } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TestFlavorForm from './TestFlavorForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function TestFlavorPage({ params }: Props) {
  const { supabase } = await requireToolAccess();

  const flavorId = parseInt(params.id, 10);
  if (isNaN(flavorId)) notFound();

  const [flavorResult, stepsResult] = await Promise.all([
    supabase
      .from('humor_flavors')
      .select('id, slug, description')
      .eq('id', flavorId)
      .single(),
    supabase
      .from('humor_flavor_steps')
      .select('id, order_by, llm_input_type_id, llm_output_type_id, llm_models(name), llm_input_types(slug), llm_output_types(slug)')
      .eq('humor_flavor_id', flavorId)
      .order('order_by', { ascending: true }),
  ]);

  if (flavorResult.error || !flavorResult.data) notFound();
  const flavor = flavorResult.data;
  const steps = stepsResult.data ?? [];

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="page-title">Test Flavor</h1>
          <p className="page-subtitle">
            Flavor:{' '}
            <span className="badge badge-primary mono">{flavor.slug}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/flavors/${flavorId}/captions`} className="button-secondary">
            View Captions
          </Link>
          <Link href={`/flavors/${flavorId}/steps`} className="button-secondary">
            ← Steps
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <TestFlavorForm flavorId={flavorId} flavorSlug={flavor.slug} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pipeline overview */}
          <div className="card-muted">
            <h3 className="section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
              How the pipeline works
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>1</span>
                Register image URL → get <code style={{ fontSize: '12px' }}>imageId</code>
              </div>
              <div style={{ paddingLeft: '28px', borderLeft: '2px solid var(--border)', marginLeft: '9px', height: '10px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>2</span>
                Run prompt chain steps → return captions
              </div>
            </div>

            <div className="divider" />

            <p className="text-xs text-dim" style={{ lineHeight: 1.6 }}>
              Uses <code>POST /pipeline/upload-image-from-url</code> then{' '}
              <code>POST /pipeline/generate-captions</code> on{' '}
              <code>api.almostcrackd.ai</code>. Your Supabase session JWT is sent
              server-side — never exposed to the browser.
            </p>
          </div>

          {/* Prompt chaining guidance */}
          <div className="card-muted" style={{ borderLeft: '3px solid var(--primary)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '10px' }}>
              Template variables for chaining
            </h3>
            <p className="text-sm text-muted" style={{ lineHeight: 1.7, marginBottom: '12px' }}>
              Use <code style={{ fontSize: '12px', background: 'var(--surface)', padding: '1px 5px', borderRadius: '3px' }}>{'${stepNOutput}'}</code> in
              any user or system prompt to inject a previous step&apos;s output.
              You can reference <strong>any step by number</strong>, and use multiple references in one prompt.
            </p>

            {/* Variable reference table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: '12px' }}>
              <div className="step-prompt-label" style={{ marginBottom: '8px' }}>Available variables for this flavor</div>
              {steps.length === 0 ? (
                <p className="text-xs text-dim">No steps yet — add steps to see available variables.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {steps.map((step, i) => {
                    const model = Array.isArray(step.llm_models) ? step.llm_models[0] : step.llm_models;
                    const outputType = Array.isArray(step.llm_output_types) ? step.llm_output_types[0] : step.llm_output_types;
                    return (
                      <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                        <code style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '4px', padding: '2px 7px', fontWeight: 700, flexShrink: 0 }}>
                          {`$\{step${i + 1}Output\}`}
                        </code>
                        <span style={{ color: 'var(--text-dim)' }}>→</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Step {i + 1} output ({(outputType as {slug?: string})?.slug ?? '?'}) from{' '}
                          <strong>{(model as {name?: string})?.name ?? '?'}</strong>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Example */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: '10px' }}>
              <div className="step-prompt-label" style={{ marginBottom: '6px', color: 'var(--success)' }}>
                ✓ Example — step 3 user prompt referencing steps 1 and 2
              </div>
              <code style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.8, display: 'block', whiteSpace: 'pre-wrap' }}>
                {`Field research notes:\n\${step2Output}\n\nSpecies identification: \${step1Output}\n\nWrite 10 nature documentary captions.`}
              </code>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
              <div className="step-prompt-label" style={{ marginBottom: '6px', color: 'var(--danger)' }}>
                ✕ These do NOT work
              </div>
              <code style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.8, display: 'block', whiteSpace: 'pre-wrap' }}>
                {`{{previous_output}}   ← wrong syntax\n{previous_output}     ← wrong syntax\n[step1 output]        ← not a variable`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
