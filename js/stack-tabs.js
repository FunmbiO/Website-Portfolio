// Tech stack tabs: a click swaps the panel. Without JS every panel stays visible.
(() => {
  const tabs = [...document.querySelectorAll('.st-tab')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  if (!tabs.length) return;
  const show = (i) => {
    tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
    panels.forEach((p, k) => { if (p) p.hidden = k !== i; });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      show(n); tabs[n].focus();
    });
  });
  show(0);
})();
