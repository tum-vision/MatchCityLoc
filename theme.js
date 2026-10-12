'use strict';

// Run in the head before styles paint, preventing a light flash on dark visits.
(() => {
  const key = 'matchcityloc-theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference = system.matches ? 'dark' : 'light';
  try {
    const saved = localStorage.getItem(key);
    if (['light', 'dark'].includes(saved)) preference = saved;
  } catch { /* The theme still works when storage is unavailable. */ }
  function apply() {
    const dark = preference === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191919' : '#ffffff');
    const button = document.querySelector('#theme-toggle');
    if (button) {
      button.hidden = false;
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelector('#theme-toggle').addEventListener('click', () => {
      preference = preference === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch { /* Optional persistence. */ }
      apply();
    });
  });
})();
