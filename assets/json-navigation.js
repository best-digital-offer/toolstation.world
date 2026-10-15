(() => {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }
  const mode = localStorage.getItem('toolstation-theme');
  if (mode) {
    document.documentElement.dataset.theme = mode;
    document.getElementById('theme-toggle')?.setAttribute('aria-pressed', String(mode === 'dark'));
  }
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.getElementById('theme-toggle')?.setAttribute('aria-pressed', String(dark));
    localStorage.setItem('toolstation-theme', dark ? 'dark' : 'light');
  });
})();
