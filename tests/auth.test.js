import test from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession, safeEqual, adminConfigured, parseCookies, sessionCookie, SESSION_SECONDS } from '../api/_lib/auth.js';

const PW = 'correct horse battery staple';

test('a fresh session verifies', () => {
  assert.equal(verifySession(signSession(PW), PW), true);
});

test('a session fails with another password', () => {
  assert.equal(verifySession(signSession(PW), 'another password entirely'), false);
});

test('an expired session is rejected', () => {
  const t = signSession(PW, Date.now() - (SESSION_SECONDS + 5) * 1000);
  assert.equal(verifySession(t, PW), false);
});

test('a tampered expiry is rejected', () => {
  const [exp, sig] = signSession(PW).split('.');
  assert.equal(verifySession(`${Number(exp) + 99999}.${sig}`, PW), false);
});

test('garbage tokens are rejected', () => {
  for (const t of ['', 'x', 'a.b.c', undefined, null, '1.2']) assert.equal(verifySession(t, PW), false);
});

test('admin stays locked when the password is missing or short', () => {
  assert.equal(adminConfigured(undefined), false);
  assert.equal(adminConfigured('short'), false);
  assert.equal(adminConfigured(PW), true);
  assert.equal(verifySession(signSession('short'), 'short'), false);
});

test('safeEqual handles different lengths', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abcd'), false);
});

test('cookie parsing and flags', () => {
  assert.deepEqual(parseCookies('a=1; fw_admin=tok; b=2'), { a: '1', fw_admin: 'tok', b: '2' });
  const c = sessionCookie('tok');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) assert.ok(c.includes(flag));
});
