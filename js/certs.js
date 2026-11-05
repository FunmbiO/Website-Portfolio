const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(v) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(v || '');
  if (!m) return '';
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function expiryState(expiresOn, now = new Date()) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(expiresOn || '');
  if (!m) return null;
  const end = new Date(Number(m[1]), Number(m[2]) - (m[3] ? 1 : 0), m[3] ? Number(m[3]) : 0, 23, 59, 59);
  return { expired: end < now, label: formatDate(expiresOn) };
}

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid) node.append(kid);
  return node;
}

function certCard(c) {
  const exp = expiryState(c.expiresOn);
  const meta = el('dl', { class: 'cert-meta' },
    el('div', {}, el('dt', { text: 'Issued' }), el('dd', { text: formatDate(c.issuedOn) })),
    exp && el('div', {}, el('dt', { text: exp.expired ? 'Expired' : 'Valid until' }), el('dd', { text: exp.label, class: exp.expired ? 'is-expired' : '' })),
    c.credentialId && el('div', {}, el('dt', { text: 'Credential ID' }), el('dd', { text: c.credentialId, class: 'mono' })),
  );

  const actions = el('div', { class: 'cert-actions' },
    c.verifyUrl && el('a', { class: 'btn sm', href: c.verifyUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Verify online ↗' }),
    c.fileUrl && el('a', { class: c.verifyUrl ? 'btn sm ghost' : 'btn sm', href: c.fileUrl, target: '_blank', rel: 'noopener noreferrer', text: 'View certificate ↗' }),
  );

  return el('article', { class: 'cert-card', 'data-issuer': c.issuer },
    el('div', { class: 'cert-issuer', text: c.issuer }),
    el('h3', { text: c.title }),
    c.description && el('p', { class: 'cert-desc', text: c.description }),
    c.skills?.length && el('ul', { class: 'stack' }, c.skills.map((s) => el('li', { text: s }))),
    meta,
    actions,
  );
}

export function renderCerts(container, items) {
  container.replaceChildren(...items.map(certCard));
}

export function renderState(container, kind) {
  const copy = {
    loading: ['Loading certifications…', ''],
    error: ['Certifications could not be loaded.', 'Please refresh the page in a moment.'],
    empty: ['New certifications are on the way.', 'Check back soon, or get in touch if you would like to see credentials for a specific skill.'],
  }[kind];
  container.replaceChildren(el('div', { class: `cert-state ${kind}` }, el('b', { text: copy[0] }), copy[1] && el('span', { text: copy[1] })));
}

export async function loadCerts() {
  const res = await fetch('/api/certs', { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.certifications) ? data.certifications : [];
}
