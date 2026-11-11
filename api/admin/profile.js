import { isAuthed, looksLikeOwnFetch } from '../_lib/auth.js';
import { allow, send } from '../_lib/http.js';
import { readProfile, writeProfile } from '../_lib/store.js';
import { validateProfile } from '../_lib/validate.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['GET', 'PUT'])) return;
  if (!isAuthed(req)) return send(res, 401, { error: 'Sign in first.' });

  try {
    if (req.method === 'GET') {
      const { photoUrl = '' } = await readProfile();
      return send(res, 200, { photoUrl });
    }
    if (!looksLikeOwnFetch(req)) return send(res, 403, { error: 'Forbidden' });
    const result = validateProfile(req.body);
    if (!result.ok) return send(res, 400, { error: result.errors.join(' ') });
    const profile = { ...(await readProfile()), ...result.value, updatedAt: new Date().toISOString() };
    await writeProfile(profile);
    send(res, 200, { photoUrl: profile.photoUrl });
  } catch (err) {
    console.error('admin profile failed', err?.message);
    send(res, 500, { error: 'Something went wrong saving that. Try again.' });
  }
}
