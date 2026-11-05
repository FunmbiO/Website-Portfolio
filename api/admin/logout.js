import { sessionCookie, looksLikeOwnFetch } from '../_lib/auth.js';
import { allow, send } from '../_lib/http.js';

export default function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  if (!looksLikeOwnFetch(req)) return send(res, 403, { error: 'Forbidden' });
  send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
}
