'use client';

import { useState, useTransition } from 'react';
import { addStep, updateStep, deleteStep, moveStep } from './actions';
import { useRouter } from 'next/navigation';
import StepForm from './StepForm';

interface LlmModel {
  id: number;
  name: string;
  is_temperature_supported: boolean;
}

interface LlmInputType {
  id: number;
  slug: string;
  description: string;
}

interface LlmOutputType {
  id: number;
  slug: string;
  description: string;
}

interface StepType {
  id: number;
  slug: string;
  description: string;
}

interface Step {
  id: number;
  order_by: number;
  llm_temperature: number | null;
  description: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  llm_model_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  humor_flavor_step_type_id: number;
  // Supabase returns joined rows as arrays
  llm_models: LlmModel[] | LlmModel | null;
  llm_input_types: LlmInputType[] | LlmInputType | null;
  llm_output_types: LlmOutputType[] | LlmOutputType | null;
  humor_flavor_step_types: StepType[] | StepType | null;
}

function first<T>(val: T[] | T | null): T | null {
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

interface Props {
  flavorId: number;
  steps: Step[];
  models: LlmModel[];
  inputTypes: LlmInputType[];
  outputTypes: LlmOutputType[];
  stepTypes: StepType[];
}

export default function StepsManager({
  flavorId,
  steps,
  models,
  inputTypes,
  outputTypes,
  stepTypes,
}: Props) {
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  function toggleExpand(stepId: number) {
    setExpandedPrompts((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }

  function handleMove(stepId: number, direction: 'up' | 'down') {
    setActionError(null);
    startTransition(async () => {
      const result = await moveStep(stepId, direction, flavorId);
      if ('error' in result) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleDelete(stepId: number) {
    if (!confirm('Delete this step? Remaining steps will be renumbered.')) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteStep(stepId, flavorId);
      if ('error' in result) setActionError(result.error);
      else router.refresh();
    });
  }

  return (
    <div>
      {actionError && <div className="alert alert-error">{actionError}</div>}

      {steps.length === 0 && !showAddForm && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <div className="empty-state-title">No steps yet</div>
            <div className="empty-state-body">
              Click &quot;Add Step&quot; to build the prompt chain.
            </div>
          </div>
        </div>
      )}

      {steps.map((step, idx) => {
        const isEditing = editingStepId === step.id;
        const isExpanded = expandedPrompts.has(step.id);

        return (
          <div key={step.id} className="step-card">
            <div className="step-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <span className="step-number">{step.order_by}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                    {first(step.llm_models)?.name ?? 'Unknown model'}
                  </div>
                  <div className="step-meta" style={{ marginTop: '4px' }}>
                    <span className="badge">
                      in: {first(step.llm_input_types)?.slug ?? '?'}
                    </span>
                    <span className="badge">
                      out: {first(step.llm_output_types)?.slug ?? '?'}
                    </span>
                    {first(step.llm_models)?.is_temperature_supported && step.llm_temperature != null && (
                      <span className="badge badge-warning">
                        temp: {step.llm_temperature}
                      </span>
                    )}
                    {first(step.humor_flavor_step_types) && (
                      <span className="badge badge-primary">
                        {first(step.humor_flavor_step_types)?.slug}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                <button
                  className="button-ghost button-sm"
                  onClick={() => handleMove(step.id, 'up')}
                  disabled={idx === 0 || isPending}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="button-ghost button-sm"
                  onClick={() => handleMove(step.id, 'down')}
                  disabled={idx === steps.length - 1 || isPending}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  className="button-secondary button-sm"
                  onClick={() => {
                    setEditingStepId(isEditing ? null : step.id);
                    setShowAddForm(false);
                  }}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                <button
                  className="button-danger button-sm"
                  onClick={() => handleDelete(step.id)}
                  disabled={isPending}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="step-card-body">
              {isEditing ? (
                <StepForm
                  flavorId={flavorId}
                  stepId={step.id}
                  models={models}
                  inputTypes={inputTypes}
                  outputTypes={outputTypes}
                  stepTypes={stepTypes}
                  defaultValues={{
                    llm_model_id: step.llm_model_id,
                    llm_input_type_id: step.llm_input_type_id,
                    llm_output_type_id: step.llm_output_type_id,
                    humor_flavor_step_type_id: step.humor_flavor_step_type_id,
                    llm_system_prompt: step.llm_system_prompt ?? '',
                    llm_user_prompt: step.llm_user_prompt ?? '',
                    llm_temperature: step.llm_temperature?.toString() ?? '',
                    description: step.description ?? '',
                  }}
                  onSave={() => {
                    setEditingStepId(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditingStepId(null)}
                />
              ) : (
                <>
                  {step.description && (
                    <div>
                      <div className="step-prompt-label">Description</div>
                      <div className="step-prompt-text">{step.description}</div>
                    </div>
                  )}

                  {step.llm_system_prompt && (
                    <div>
                      <div className="step-prompt-label">System Prompt</div>
                      <div
                        className={`step-prompt-text${isExpanded ? '' : ' step-prompt-collapse'}`}
                      >
                        {step.llm_system_prompt}
                      </div>
                    </div>
                  )}

                  {step.llm_user_prompt && (
                    <div>
                      <div className="step-prompt-label">User Prompt</div>
                      <div
                        className={`step-prompt-text${isExpanded ? '' : ' step-prompt-collapse'}`}
                      >
                        {step.llm_user_prompt}
                      </div>
                    </div>
                  )}

                  {(step.llm_system_prompt || step.llm_user_prompt) && (
                    <button
                      className="button-ghost button-sm"
                      onClick={() => toggleExpand(step.id)}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {isExpanded ? 'Show less ↑' : 'Show more ↓'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      {showAddForm && (
        <div className="card mt-4">
          <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '16px' }}>
            Add New Step
          </h3>
          <StepForm
            flavorId={flavorId}
            models={models}
            inputTypes={inputTypes}
            outputTypes={outputTypes}
            stepTypes={stepTypes}
            onSave={() => {
              setShowAddForm(false);
              router.refresh();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {!showAddForm && (
        <button
          className="button mt-4"
          onClick={() => {
            setShowAddForm(true);
            setEditingStepId(null);
          }}
        >
          + Add Step
        </button>
      )}
    </div>
  );
}
