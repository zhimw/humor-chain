'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'system', label: 'System', icon: '💻' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) || 'system';
    setTheme(stored);
  }, []);

  function applyTheme(t: Theme) {
    setTheme(t);
    localStorage.setItem('theme', t);

    if (t === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', t);
    }
  }

  return (
    <div className="theme-toggle">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`theme-toggle-btn${theme === opt.value ? ' active' : ''}`}
          onClick={() => applyTheme(opt.value)}
          title={opt.label}
          aria-label={`Set theme: ${opt.label}`}
        >
          <span>{opt.icon}</span>
        </button>
      ))}
    </div>
  );
}
