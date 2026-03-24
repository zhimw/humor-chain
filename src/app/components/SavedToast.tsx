'use client';

import { useEffect, useState } from 'react';

interface SavedToastProps {
  message?: string;
  type?: 'success' | 'error';
  duration?: number;
}

export default function SavedToast({
  message = 'Saved successfully!',
  type = 'success',
  duration = 3000,
}: SavedToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className={`toast toast-${type}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
    </div>
  );
}
