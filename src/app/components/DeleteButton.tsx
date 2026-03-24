'use client';

import { useState } from 'react';

interface DeleteButtonProps {
  onDelete: () => Promise<{ error?: string } | void>;
  confirmMessage?: string;
  label?: string;
  disabled?: boolean;
}

export default function DeleteButton({
  onDelete,
  confirmMessage = 'Are you sure you want to delete this item? This action cannot be undone.',
  label = 'Delete',
  disabled = false,
}: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    setError(null);

    try {
      const result = await onDelete();
      if (result && 'error' in result && result.error) {
        setError(result.error);
      }
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || disabled}
        className="button-danger button-sm"
      >
        {loading ? '…' : label}
      </button>
      {error && (
        <div className="form-error" style={{ marginTop: '4px', maxWidth: '200px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
