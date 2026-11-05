import { randomUUID } from 'node:crypto';
import { isAuthed, looksLikeOwnFetch } from '../_lib/auth.js';
import { allow, send } from '../_lib/http.js';
import { readAll, writeAll } from '../_lib/store.js';
import { validateCert, sortCerts } from '../_lib/validate.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  if (!isAuthed(req)) return send(res, 401, { error: 'Sign in first.' });
  if (req.method !== 'GET' && !looksLikeOwnFetch(req)) return send(res, 403, { error: 'Forbidden' });

  try {
    const items = await readAll();
    if (req.method === 'GET') return send(res, 200, { certifications: sortCerts(items) });

    const id = typeof req.query?.id === 'string' ? req.query.id : '';

    if (req.method === 'DELETE') {
      if (!items.some((c) => c.id === id)) return send(res, 404, { error: 'Not found.' });
      await writeAll(items.filter((c) => c.id !== id));
      return send(res, 200, { ok: true });
    }

    const result = validateCert(req.body);
    if (!result.ok) return send(res, 400, { error: result.errors.join(' '), errors: result.errors });

    if (req.method === 'POST') {
      const created = { id: randomUUID(), createdAt: new Date().toISOString(), ...result.value };
      await writeAll([...items, created]);
      return send(res, 201, { certification: created });
    }

    // PUT
    const index = items.findIndex((c) => c.id === id);
    if (index === -1) return send(res, 404, { error: 'Not found.' });
    const updated = { ...items[index], ...result.value, updatedAt: new Date().toISOString() };
    items[index] = updated;
    await writeAll(items);
    return send(res, 200, { certification: updated });
  } catch (err) {
    console.error('admin certs failed', err?.message);
    send(res, 500, { error: 'Something went wrong saving that. Try again.' });
  }
}
