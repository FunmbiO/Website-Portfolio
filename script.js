(() => {
  // hero preview tabs
  const tabs = document.querySelectorAll('.tab');
  const mocks = document.querySelectorAll('.mock');
  const urlEl = document.getElementById('preview-url');
  const show = (id) => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.target === id)));
    mocks.forEach((m) => {
      const on = m.dataset.mock === id;
      m.classList.toggle('on', on);
      if (on && urlEl) urlEl.textContent = m.dataset.url;
    });
  };
  tabs.forEach((t) => t.addEventListener('click', () => { stop(); show(t.dataset.target); }));

  // gentle auto-rotate until the visitor interacts
  let i = 0;
  const ids = [...tabs].map((t) => t.dataset.target);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = reduced ? null : setInterval(() => { i = (i + 1) % ids.length; show(ids[i]); }, 4500);
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  // reveal on scroll
  const els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('in'));
  }

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
