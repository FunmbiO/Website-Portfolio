import { readAll } from './_lib/store.js';
import { sortCerts } from './_lib/validate.js';
import { allow, send } from './_lib/http.js';

// Public: the list the website renders. Cached briefly at the edge.
export default async function handler(req, res) {
  if (!allow(req, res, ['GET'])) return;
  try {
    const items = sortCerts(await readAll());
    send(res, 200, { certifications: items }, { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' });
  } catch (err) {
    console.error('certs read failed', err?.message);
    send(res, 502, { error: 'Certifications are temporarily unavailable.' });
  }
}
