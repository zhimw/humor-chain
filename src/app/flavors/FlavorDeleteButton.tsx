'use client';

import { useState, useTransition } from 'react';
import { deleteFlavor } from './actions';
import { useRouter } from 'next/navigation';

interface Props {
  id: number;
  stepCount: number;
}

export default function FlavorDeleteButton({ id, stepCount }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (
      !confirm(
        stepCount > 0
          ? `This flavor has ${stepCount} step(s). You must delete all steps before deleting the flavor.`
          : 'Delete this flavor? This action cannot be undone.'
      )
    )
      return;

    setError(null);
    startTransition(async () => {
      const result = await deleteFlavor(id);
      if ('error' in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="button-danger button-sm"
      >
        {isPending ? '…' : 'Delete'}
      </button>
      {error && (
        <div
          className="form-error"
          style={{ position: 'absolute', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', zIndex: 50, maxWidth: '260px', marginTop: '4px' }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
