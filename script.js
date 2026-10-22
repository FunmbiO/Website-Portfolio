(() => {
  const vp = document.getElementById('viewport');
  const stage = document.getElementById('vp-stage');
  const loading = document.getElementById('vp-loading');
  const urlEl = document.getElementById('preview-url');
  const openEl = document.getElementById('preview-open');
  const dimEl = document.getElementById('preview-dim');
  const frames = [...document.querySelectorAll('.vp-frame')];
  const tabs = document.querySelectorAll('.tab[data-target]');
  const devs = document.querySelectorAll('.tab[data-device]');
  const SIZES = { desktop: [1280, 800], mobile: [390, 844] };
  let device = 'desktop';
  let current = 'jaded-media';

  // scale the fixed-size stage so the whole page fits the viewport
  const fit = () => {
    const [w, h] = SIZES[device];
    const vw = vp.clientWidth, vh = vp.clientHeight;
    const k = device === 'desktop' ? vw / w : (vh - 24) / h;
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';
    const left = device === 'desktop' ? 0 : (vw - w * k) / 2;
    const top = device === 'desktop' ? 0 : 12;
    stage.style.transform = `translate(${left}px, ${top}px) scale(${k})`;
    if (dimEl) dimEl.textContent = `${w} \u00d7 ${h}`;
  };
  new ResizeObserver(fit).observe(vp);
  fit();

  const load = (f) => {
    if (!f.getAttribute('src') && f.dataset.src) f.setAttribute('src', f.dataset.src);
  };
  frames.forEach((f) => f.addEventListener('load', () => {
    if (f.dataset.site === current) loading.classList.add('done');
  }));
  // backstop: never leave the spinner up if a load event is missed
  setTimeout(() => loading.classList.add('done'), 8000);

  const showSite = (id) => {
    current = id;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.target === id)));
    frames.forEach((f) => {
      const on = f.dataset.site === id;
      if (on) { load(f); urlEl.textContent = f.dataset.url; openEl.href = f.dataset.href; }
      f.classList.toggle('on', on);
    });
  };
  tabs.forEach((t) => t.addEventListener('click', () => showSite(t.dataset.target)));

  devs.forEach((b) => b.addEventListener('click', () => {
    device = b.dataset.device;
    vp.dataset.device = device;
    devs.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    fit();
  }));

  // work-card thumbnails: scale to card width, load when near the viewport
  const thumbs = document.querySelectorAll('.thumb');
  const sizeThumb = (t) => t.style.setProperty('--k', (t.clientWidth / 1280).toFixed(4));
  const thumbIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const f = e.target.querySelector('iframe');
      f.addEventListener('load', () => f.classList.add('ready'));
      f.src = f.dataset.src;
      thumbIO.unobserve(e.target);
    });
  }, { rootMargin: '300px' }) : null;
  thumbs.forEach((t) => {
    new ResizeObserver(() => sizeThumb(t)).observe(t);
    sizeThumb(t);
    if (thumbIO) thumbIO.observe(t);
    else { const f = t.querySelector('iframe'); f.src = f.dataset.src; f.classList.add('ready'); }
  });

  // warm the second site once the page is idle
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 2500));
  idle(() => frames.forEach(load));

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
