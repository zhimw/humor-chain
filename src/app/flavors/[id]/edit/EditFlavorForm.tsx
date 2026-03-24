'use client';

import { useState, useTransition } from 'react';
import { updateFlavor } from '../../actions';
import SavedToast from '@/app/components/SavedToast';

interface Flavor {
  id: number;
  slug: string;
  description: string | null;
}

interface Props {
  flavor: Flavor;
}

export default function EditFlavorForm({ flavor }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateFlavor(flavor.id, formData);
      if ('error' in result) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <>
      {saved && <SavedToast message="Flavor updated successfully!" />}

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="edit-slug">
            Slug <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            id="edit-slug"
            name="slug"
            type="text"
            className="input"
            defaultValue={flavor.slug}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
          />
          <p className="form-hint">Lowercase letters, numbers, and hyphens only</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-description">
            Description
          </label>
          <textarea
            id="edit-description"
            name="description"
            className="input"
            defaultValue={flavor.description ?? ''}
            rows={4}
            placeholder="Describe this humor flavor…"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <a href="/flavors" className="button-secondary">
            Cancel
          </a>
          <button type="submit" className="button" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </>
  );
}
