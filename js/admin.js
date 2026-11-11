const $ = (id) => document.getElementById(id);
const HEADERS = { 'X-Requested-With': 'portfolio-admin' };
let items = [];
let editingId = null;
let uploaded = { fileUrl: '', fileName: '' };
let logo = '';
let logoDismissed = false;

function say(msg, kind = 'ok') {
  const n = $('notice');
  n.textContent = msg;
  n.className = `notice ${kind}`;
  n.hidden = !msg;
  if (msg) n.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...opts,
    headers: { ...HEADERS, ...(opts.headers || {}) },
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

function show(which) {
  for (const id of ['login', 'setup', 'app']) $(id).hidden = id !== which;
  $('logout').hidden = which !== 'app';
}


// Big photos are shrunk in the browser first, so uploads stay quick and pages stay light.
async function shrink(file, maxSide) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  if (k === 1 && file.size <= 1.5 * 1024 * 1024) { bmp.close?.(); return file; }
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.9));
  return blob && blob.size < file.size ? blob : file;
}

async function uploadImage(file, kind, maxSide) {
  const body = await shrink(file, maxSide);
  return api(`/api/admin/upload?kind=${kind}&name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body,
  });
}

// ---- profile photo
function drawPhoto(url) {
  const box = $('photo-preview');
  box.replaceChildren();
  if (url) {
    const img = document.createElement('img');
    img.alt = 'Your current profile photo';
    img.src = url;
    box.append(img);
  } else {
    const s = document.createElement('span');
    s.className = 'muted small';
    s.textContent = 'No photo yet';
    box.append(s);
  }
  $('photo-clear').hidden = !url;
}

async function loadPhoto() {
  try { drawPhoto((await api('/api/admin/profile')).photoUrl); } catch (e) { say(e.message, 'err'); }
}

async function savePhoto(photoUrl) {
  const out = await api('/api/admin/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoUrl }),
  });
  drawPhoto(out.photoUrl);
}

$('photo-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $('photo-state').textContent = 'Uploading…';
  try {
    const up = await uploadImage(file, 'photo', 1600);
    await savePhoto(up.url);
    say('Photo saved. It shows on the site within a minute.');
  } catch (err) { say(err.message, 'err'); }
  $('photo-state').textContent = '';
  e.target.value = '';
});

$('photo-clear').addEventListener('click', async () => {
  if (!confirm('Remove your profile photo from the site?')) return;
  try { await savePhoto(''); say('Photo removed.'); } catch (err) { say(err.message, 'err'); }
});

// ---- issuer logo
function setLogoState(note = '') {
  const img = $('logo-preview');
  img.hidden = !logo;
  if (logo) img.src = logo;
  $('logo-clear').hidden = !logo;
  $('logo-state').textContent = note;
}

// Same issuer as an earlier certificate? Reuse its logo so you only upload it once.
function suggestLogo() {
  if (logo || logoDismissed) return;
  const issuer = $('f-issuer').value.trim().toLowerCase();
  if (!issuer) return;
  const match = items.find((c) => c.logoUrl && c.issuer.toLowerCase() === issuer && c.id !== editingId);
  if (match) { logo = match.logoUrl; setLogoState(`Using the logo from your other ${match.issuer} certificate.`); }
}

$('f-issuer').addEventListener('input', suggestLogo);

$('f-logo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $('logo-state').textContent = 'Uploading…';
  try {
    const up = await uploadImage(file, 'logo', 400);
    logo = up.url;
    logoDismissed = false;
    setLogoState('Logo attached. Save the certification to publish it.');
  } catch (err) { say(err.message, 'err'); setLogoState(); }
  e.target.value = '';
});

$('logo-clear').addEventListener('click', () => { logo = ''; logoDismissed = true; setLogoState(); });

async function boot() {
  try {
    const s = await api('/api/admin/session');
    if (!s.configured) return show('setup');
    if (!s.authed) return show('login');
    show('app');
    await refresh();
    await loadPhoto();
  } catch (e) {
    say(e.message, 'err');
  }
}

async function refresh() {
  const data = await api('/api/admin/certs');
  items = data.certifications;
  $('total').textContent = `(${items.length})`;
  const list = $('list');
  list.replaceChildren();
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Nothing added yet. Use the form above.';
    list.append(li);
    return;
  }
  for (const c of items) {
    const li = document.createElement('li');
    const info = document.createElement('div');
    const t = document.createElement('b');
    t.textContent = c.title;
    const sub = document.createElement('span');
    sub.className = 'muted';
    sub.textContent = ` · ${c.issuer} · ${c.issuedOn}${c.featured ? ' · featured' : ''}`;
    if (c.logoUrl) {
      const lg = document.createElement('img');
      lg.className = 'row-logo'; lg.alt = ''; lg.src = c.logoUrl; lg.width = 28; lg.height = 28;
      info.append(lg);
    }
    info.append(t, sub);
    const btns = document.createElement('div');
    btns.className = 'row-actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'tab'; edit.textContent = 'Edit';
    edit.addEventListener('click', () => startEdit(c));
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'tab danger'; del.textContent = 'Delete';
    del.addEventListener('click', () => remove(c));
    btns.append(edit, del);
    li.append(info, btns);
    list.append(li);
  }
}

function resetForm() {
  editingId = null;
  uploaded = { fileUrl: '', fileName: '' };
  logo = ''; logoDismissed = false;
  $('cert-form').reset();
  $('form-title').textContent = 'Add a certification';
  $('cancel').hidden = true;
  setFileState();
  setLogoState();
}

function setFileState() {
  $('file-state').textContent = uploaded.fileUrl ? `Attached: ${uploaded.fileName}` : '';
  $('file-clear').hidden = !uploaded.fileUrl;
}

function startEdit(c) {
  editingId = c.id;
  $('f-title').value = c.title;
  $('f-issuer').value = c.issuer;
  $('f-issued').value = c.issuedOn;
  $('f-expires').value = c.expiresOn || '';
  $('f-cid').value = c.credentialId || '';
  $('f-url').value = c.verifyUrl || '';
  $('f-skills').value = (c.skills || []).join(', ');
  $('f-desc').value = c.description || '';
  $('f-featured').checked = !!c.featured;
  uploaded = { fileUrl: c.fileUrl || '', fileName: c.fileName || '' };
  logo = c.logoUrl || ''; logoDismissed = false;
  setFileState();
  setLogoState();
  $('form-title').textContent = 'Edit certification';
  $('cancel').hidden = false;
  $('cert-form').scrollIntoView({ behavior: 'smooth' });
}

async function remove(c) {
  if (!confirm(`Delete "${c.title}"? This can't be undone.`)) return;
  try {
    await api(`/api/admin/certs?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' });
    say('Deleted.');
    if (editingId === c.id) resetForm();
    await refresh();
  } catch (e) { say(e.message, 'err'); }
}

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  say('');
  try {
    await api('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: $('pw').value }),
    });
    $('pw').value = '';
    show('app');
    await refresh();
    await loadPhoto();
  } catch (err) { say(err.message, 'err'); }
});

$('logout').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
  items = []; resetForm(); say(''); show('login');
});

$('f-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) { say('That file is larger than 4 MB.', 'err'); e.target.value = ''; return; }
  $('file-state').textContent = 'Uploading…';
  try {
    const out = await api(`/api/admin/upload?name=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,
    });
    uploaded = { fileUrl: out.url, fileName: out.fileName };
    say('File uploaded. Save the certification to publish it.');
  } catch (err) { say(err.message, 'err'); uploaded = { fileUrl: '', fileName: '' }; }
  setFileState();
  e.target.value = '';
});

$('file-clear').addEventListener('click', () => { uploaded = { fileUrl: '', fileName: '' }; setFileState(); });
$('cancel').addEventListener('click', resetForm);

$('cert-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    title: $('f-title').value,
    issuer: $('f-issuer').value,
    issuedOn: $('f-issued').value,
    expiresOn: $('f-expires').value,
    credentialId: $('f-cid').value,
    verifyUrl: $('f-url').value,
    fileUrl: uploaded.fileUrl,
    fileName: uploaded.fileName,
    logoUrl: logo,
    skills: $('f-skills').value.split(',').map((s) => s.trim()).filter(Boolean),
    description: $('f-desc').value,
    featured: $('f-featured').checked,
  };
  $('save').disabled = true;
  try {
    await api(editingId ? `/api/admin/certs?id=${encodeURIComponent(editingId)}` : '/api/admin/certs', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    say(editingId ? 'Changes saved.' : 'Certification added. It will appear on the site within a minute.');
    resetForm();
    await refresh();
  } catch (err) {
    say(err.message, 'err');
    if (err.status === 401) show('login');
  } finally { $('save').disabled = false; }
});

boot();
