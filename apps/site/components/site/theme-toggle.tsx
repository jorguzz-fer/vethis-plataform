'use client';

import { useEffect, useState } from 'react';

const SUN = (
  <>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
  </>
);
const MOON = <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />;

/**
 * Toggle claro/escuro por `data-theme` no <html>, replicando o <script> do
 * protótipo. O tema inicial é aplicado antes da pintura por um script inline
 * no <head> (ver layout.tsx); aqui só lemos o estado atual e alternamos.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('vethis-theme', next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        {theme === 'dark' ? MOON : SUN}
      </svg>
    </button>
  );
}
