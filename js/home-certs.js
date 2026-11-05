import { loadCerts, renderCerts, renderState } from './certs.js';

const grid = document.getElementById('home-cert-grid');
const count = document.getElementById('home-cert-count');
const more = document.getElementById('home-cert-more');

renderState(grid, 'loading');
loadCerts()
  .then((items) => {
    count.textContent = String(items.length).padStart(2, '0');
    if (!items.length) { more.hidden = true; return renderState(grid, 'empty'); }
    const featured = items.filter((c) => c.featured);
    const top = [...featured, ...items.filter((c) => !c.featured)].slice(0, 3);
    renderCerts(grid, top);
    more.hidden = items.length <= top.length && !items.length;
  })
  .catch(() => { count.textContent = '—'; renderState(grid, 'error'); });
