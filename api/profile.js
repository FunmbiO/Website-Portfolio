import { readProfile } from './_lib/store.js';
import { allow, send } from './_lib/http.js';

// Public: just the photo address the site needs. Cached briefly at the edge.
export default async function handler(req, res) {
  if (!allow(req, res, ['GET'])) return;
  try {
    const { photoUrl = '' } = await readProfile();
    send(res, 200, { photoUrl }, { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' });
  } catch (err) {
    console.error('profile read failed', err?.message);
    send(res, 200, { photoUrl: '' });
  }
}
