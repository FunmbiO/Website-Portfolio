import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'fw_admin';
export const SESSION_SECONDS = 8 * 60 * 60;
export const MIN_PASSWORD_LENGTH = 12;

const key = (password) => createHash('sha256').update(`portfolio-admin:${password}`).digest();
const mac = (password, msg) => createHmac('sha256', key(password)).update(msg).digest('hex');

// Compare two strings in constant time without leaking their lengths.
export function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function adminConfigured(password) {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
}

export function signSession(password, nowMs = Date.now()) {
  const exp = Math.floor(nowMs / 1000) + SESSION_SECONDS;
  return `${exp}.${mac(password, `session.${exp}`)}`;
}

export function verifySession(token, password, nowMs = Date.now()) {
  if (!adminConfigured(password) || typeof token !== 'string') return false;
  const [expStr, sig, extra] = token.split('.');
  if (extra !== undefined || !/^\d{9,12}$/.test(expStr || '') || !/^[a-f0-9]{64}$/.test(sig || '')) return false;
  if (Number(expStr) * 1000 < nowMs) return false;
  return safeEqual(sig, mac(password, `session.${expStr}`));
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookie(token, maxAge = SESSION_SECONDS) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function isAuthed(req, password = process.env.ADMIN_PASSWORD) {
  const token = parseCookies(req.headers.cookie || '')[COOKIE];
  return verifySession(token, password);
}

// Mutating admin calls must come from this site's own JS: SameSite=Strict
// already blocks cross-site cookies; the header is a second, cheap check.
export function looksLikeOwnFetch(req) {
  return req.headers['x-requested-with'] === 'portfolio-admin';
}
