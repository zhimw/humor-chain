'use client';

import { useState, useTransition } from 'react';
import { createFlavor } from './actions';
import { useRouter } from 'next/navigation';

export default function FlavorCreateModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClose() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createFlavor(formData);
      if ('error' in result) {
        setError(result.error);
      } else {
        handleClose();
        router.refresh();
      }
    });
  }

  return (
    <>
      <button className="button" onClick={() => setOpen(true)}>
        + New Flavor
      </button>

      {open && (
        <div className="modal-backdrop" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Humor Flavor</h2>
              <button className="modal-close" onClick={handleClose} aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="create-slug">
                  Slug <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="create-slug"
                  name="slug"
                  type="text"
                  className="input"
                  placeholder="e.g. dry-wit"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                  autoFocus
                />
                <p className="form-hint">Lowercase letters, numbers, and hyphens only</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-description">
                  Description
                </label>
                <textarea
                  id="create-description"
                  name="description"
                  className="input"
                  placeholder="Describe this humor flavor…"
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button type="submit" className="button" disabled={isPending}>
                  {isPending ? 'Creating…' : 'Create Flavor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
