'use strict';

(() => {
  const button = document.querySelector('#copy-citation');
  const code = document.querySelector('#citation-bibtex');
  const status = document.querySelector('#citation-status');
  const label = button.querySelector('span');
  let reset;
  button.hidden = false;
  button.addEventListener('click', async () => {
    clearTimeout(reset);
    label.textContent = 'Copy';
    try {
      await navigator.clipboard.writeText(code.textContent.trim());
      label.textContent = 'Copied!';
      status.textContent = 'BibTeX copied to clipboard.';
    } catch {
      // Clipboard access may be blocked on file://, HTTP, or by permissions.
      // Select the visible citation so a normal keyboard copy still works.
      code.parentElement.focus();
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Citation selected. Press Ctrl+C or ⌘C to copy.';
    }
    reset = setTimeout(() => { label.textContent = 'Copy'; }, 2200);
  });
})();
