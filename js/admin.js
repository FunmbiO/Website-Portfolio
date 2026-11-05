const $ = (id) => document.getElementById(id);
const HEADERS = { 'X-Requested-With': 'portfolio-admin' };
let items = [];
let editingId = null;
let uploaded = { fileUrl: '', fileName: '' };

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

async function boot() {
  try {
    const s = await api('/api/admin/session');
    if (!s.configured) return show('setup');
    if (!s.authed) return show('login');
    show('app');
    await refresh();
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
  $('cert-form').reset();
  $('form-title').textContent = 'Add a certification';
  $('cancel').hidden = true;
  setFileState();
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
  setFileState();
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
