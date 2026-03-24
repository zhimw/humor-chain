'use client';

import { useState, useTransition } from 'react';
import { addStep, updateStep } from './actions';

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

interface DefaultValues {
  llm_model_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  humor_flavor_step_type_id: number;
  llm_system_prompt: string;
  llm_user_prompt: string;
  llm_temperature: string;
  description: string;
}

interface Props {
  flavorId: number;
  stepId?: number;
  models: LlmModel[];
  inputTypes: LlmInputType[];
  outputTypes: LlmOutputType[];
  stepTypes: StepType[];
  defaultValues?: DefaultValues;
  onSave: () => void;
  onCancel: () => void;
}

export default function StepForm({
  flavorId,
  stepId,
  models,
  inputTypes,
  outputTypes,
  stepTypes,
  defaultValues,
  onSave,
  onCancel,
}: Props) {
  const [selectedModelId, setSelectedModelId] = useState<number>(
    defaultValues?.llm_model_id ?? (models[0]?.id ?? 0)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const showTemperature = selectedModel?.is_temperature_supported ?? false;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = stepId
        ? await updateStep(stepId, flavorId, formData)
        : await addStep(flavorId, formData);

      if ('error' in result) {
        setError(result.error);
      } else {
        onSave();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="form-model">
            LLM Model <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            id="form-model"
            name="llm_model_id"
            className="input"
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(parseInt(e.target.value, 10))}
            required
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="form-step-type">
            Step Type <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            id="form-step-type"
            name="humor_flavor_step_type_id"
            className="input"
            defaultValue={defaultValues?.humor_flavor_step_type_id ?? ''}
            required
          >
            <option value="" disabled>
              Select step type…
            </option>
            {stepTypes.map((t) => (
              <option key={t.id} value={t.id} title={t.description}>
                {t.slug}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="form-input-type">
            Input Type <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            id="form-input-type"
            name="llm_input_type_id"
            className="input"
            defaultValue={defaultValues?.llm_input_type_id ?? ''}
            required
          >
            <option value="" disabled>
              Select input type…
            </option>
            {inputTypes.map((t) => (
              <option key={t.id} value={t.id} title={t.description}>
                {t.slug}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="form-output-type">
            Output Type <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            id="form-output-type"
            name="llm_output_type_id"
            className="input"
            defaultValue={defaultValues?.llm_output_type_id ?? ''}
            required
          >
            <option value="" disabled>
              Select output type…
            </option>
            {outputTypes.map((t) => (
              <option key={t.id} value={t.id} title={t.description}>
                {t.slug}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showTemperature && (
        <div className="form-group" style={{ maxWidth: '200px' }}>
          <label className="form-label" htmlFor="form-temperature">
            Temperature
          </label>
          <input
            id="form-temperature"
            name="llm_temperature"
            type="number"
            className="input"
            min={0}
            max={2}
            step={0.1}
            defaultValue={defaultValues?.llm_temperature ?? ''}
            placeholder="e.g. 0.7"
          />
          <p className="form-hint">0.0 – 2.0</p>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="form-description">
          Step Description
        </label>
        <input
          id="form-description"
          name="description"
          type="text"
          className="input"
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Short description of what this step does…"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="form-system-prompt">
          System Prompt
        </label>
        <textarea
          id="form-system-prompt"
          name="llm_system_prompt"
          className="input mono"
          defaultValue={defaultValues?.llm_system_prompt ?? ''}
          rows={5}
          placeholder="You are a helpful assistant…"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="form-user-prompt">
          User Prompt
        </label>
        <textarea
          id="form-user-prompt"
          name="llm_user_prompt"
          className="input mono"
          defaultValue={defaultValues?.llm_user_prompt ?? ''}
          rows={5}
          placeholder="Describe the image and generate a caption…"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? 'Saving…' : stepId ? 'Save Changes' : 'Add Step'}
        </button>
      </div>
    </form>
  );
}
