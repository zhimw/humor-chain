'use client';

import { useState, useTransition, useEffect } from 'react';
import { duplicateFlavor } from './actions';
import { useRouter } from 'next/navigation';

interface Props {
  id: number;
  sourceSlug: string;
}

export default function FlavorDuplicateButton({ id, sourceSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setNewSlug(`${sourceSlug}-copy`);
      setError(null);
    }
  }, [open, sourceSlug]);

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await duplicateFlavor(id, newSlug);
      if ('error' in result) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button className="button-secondary button-sm" onClick={() => setOpen(true)}>
        Duplicate
      </button>

      {open && (
        <div className="modal-backdrop" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Duplicate Flavor</h2>
              <button className="modal-close" onClick={handleClose} aria-label="Close" disabled={isPending}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
                Duplicating <strong style={{ color: 'var(--text)' }}>{sourceSlug}</strong> along with all its steps. Choose a unique slug for the new flavor.
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="dup-slug">
                  New Slug <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="dup-slug"
                  type="text"
                  className="input"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="e.g. dry-wit-copy"
                  required
                  autoFocus
                  disabled={isPending}
                />
                <p className="form-hint">Lowercase letters, numbers, and hyphens only</p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button type="submit" className="button" disabled={isPending}>
                  {isPending ? 'Duplicating…' : 'Duplicate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
