import { adminConfigured, safeEqual, signSession, sessionCookie, looksLikeOwnFetch } from '../_lib/auth.js';
import { allow, send, clientIp } from '../_lib/http.js';

// Best-effort throttle per warm instance, on top of the fixed delay below.
const tries = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 8;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  const password = process.env.ADMIN_PASSWORD;
  if (!adminConfigured(password)) {
    return send(res, 503, { error: 'Admin is not set up yet. Add ADMIN_PASSWORD (12+ characters) in the Vercel project settings.' });
  }
  if (!looksLikeOwnFetch(req)) return send(res, 403, { error: 'Forbidden' });

  const ip = clientIp(req);
  const now = Date.now();
  const rec = (tries.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (rec.length >= MAX_TRIES) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });

  const supplied = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!safeEqual(supplied, password)) {
    rec.push(now);
    tries.set(ip, rec);
    await sleep(600);
    return send(res, 401, { error: 'Wrong password.' });
  }
  tries.delete(ip);
  send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(signSession(password)) });
}
