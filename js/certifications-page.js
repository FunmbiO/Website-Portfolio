import { loadCerts, renderCerts, renderState } from './certs.js';

const grid = document.getElementById('cert-grid');
const filters = document.getElementById('cert-filters');
const count = document.getElementById('cert-count');
let all = [];
let active = 'All';

function drawFilters() {
  const issuers = [...new Set(all.map((c) => c.issuer))].sort();
  filters.replaceChildren();
  if (issuers.length < 2) return;
  for (const name of ['All', ...issuers]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab';
    b.textContent = name;
    b.setAttribute('aria-pressed', String(name === active));
    b.addEventListener('click', () => { active = name; drawFilters(); draw(); });
    filters.append(b);
  }
}

function draw() {
  const items = active === 'All' ? all : all.filter((c) => c.issuer === active);
  if (!items.length) return renderState(grid, 'empty');
  renderCerts(grid, items);
}

renderState(grid, 'loading');
loadCerts()
  .then((items) => {
    all = items;
    count.textContent = String(items.length).padStart(2, '0');
    if (!items.length) return renderState(grid, 'empty');
    drawFilters();
    draw();
  })
  .catch(() => { count.textContent = '—'; renderState(grid, 'error'); });
