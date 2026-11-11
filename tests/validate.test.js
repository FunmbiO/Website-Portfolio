import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCert, safeFilename, sortCerts } from '../api/_lib/validate.js';

const base = { title: 'Example Certificate', issuer: 'Example Org', issuedOn: '2026-03', verifyUrl: 'https://example.com/verify/123' };

test('accepts a minimal valid certificate', () => {
  const r = validateCert(base);
  assert.equal(r.ok, true);
  assert.equal(r.value.title, 'Example Certificate');
  assert.deepEqual(r.value.skills, []);
});

test('requires title, issuer and a valid date', () => {
  const r = validateCert({ verifyUrl: base.verifyUrl, issuedOn: '03/2026' });
  assert.equal(r.ok, false);
  assert.equal(r.errors.length, 3);
});

test('rejects non-https verification links', () => {
  for (const u of ['http://example.com', 'javascript:alert(1)', 'data:text/html,hi', 'ftp://x.com', 'not a url']) {
    assert.equal(validateCert({ ...base, verifyUrl: u }).ok, false, u);
  }
});

test('needs a link or a file', () => {
  assert.equal(validateCert({ ...base, verifyUrl: '' }).ok, false);
});

test('file urls must come from the blob store', () => {
  assert.equal(validateCert({ ...base, fileUrl: 'https://evil.example/x.pdf' }).ok, false);
  const ok = validateCert({ ...base, verifyUrl: '', fileUrl: 'https://abc123.public.blob.vercel-storage.com/certificates/x.pdf', fileName: 'x.pdf' });
  assert.equal(ok.ok, true);
});

test('skills are trimmed, de-duplicated and capped', () => {
  const skills = Array.from({ length: 20 }, (_, i) => ` Skill ${i % 15} `);
  const r = validateCert({ ...base, skills });
  assert.equal(r.value.skills.length, 12);
  assert.equal(new Set(r.value.skills).size, 12);
});

test('long text is truncated, not trusted', () => {
  const r = validateCert({ ...base, title: 'x'.repeat(500), description: 'y'.repeat(5000) });
  assert.equal(r.value.title.length, 140);
  assert.equal(r.value.description.length, 600);
});

test('filenames are made safe', () => {
  assert.equal(safeFilename('../../My Cert (final).PDF', 'pdf'), 'my-cert-final.pdf');
  assert.equal(safeFilename('', 'png'), 'certificate.png');
});

test('sorts newest first', () => {
  const out = sortCerts([{ issuedOn: '2024-01' }, { issuedOn: '2026-05' }, { issuedOn: '2025-12' }]);
  assert.deepEqual(out.map((c) => c.issuedOn), ['2026-05', '2025-12', '2024-01']);
});

import { detectType } from '../api/_lib/validate.js';

test('detects file types from content, not names', () => {
  const pad = Buffer.alloc(16);
  assert.equal(detectType(Buffer.concat([Buffer.from('%PDF-1.7'), pad])), 'application/pdf');
  assert.equal(detectType(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pad])), 'image/png');
  assert.equal(detectType(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), pad])), 'image/jpeg');
  assert.equal(detectType(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), pad])), 'image/webp');
});

test('rejects scripts and html disguised as certificates', () => {
  assert.equal(detectType(Buffer.from('<script>alert(1)</script>  padding')), null);
  assert.equal(detectType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  assert.equal(detectType(Buffer.from('short')), null);
});

import { blobUrl, uploadRule, validateProfile } from '../api/_lib/validate.js';

const BLOB = 'https://abc123.public.blob.vercel-storage.com';

test('a logo must be one of our own files in the logos folder', () => {
  const ok = validateCert({ ...base, logoUrl: `${BLOB}/logos/ab12-google.png` });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.logoUrl, `${BLOB}/logos/ab12-google.png`);
  for (const u of ['https://evil.example/logo.png', `${BLOB}/certificates/x.png`, 'http://abc.public.blob.vercel-storage.com/logos/x.png']) {
    assert.equal(validateCert({ ...base, logoUrl: u }).ok, false, u);
  }
  assert.equal(validateCert(base).value.logoUrl, '');
});

test('certificate files must now live in the certificates folder', () => {
  assert.equal(validateCert({ ...base, verifyUrl: '', fileUrl: `${BLOB}/logos/x.png` }).ok, false);
  assert.equal(validateCert({ ...base, verifyUrl: '', fileUrl: `${BLOB}/certificates/x.pdf` }).ok, true);
});

test('blobUrl checks host and folder', () => {
  assert.equal(blobUrl('', 'logos'), '');
  assert.equal(blobUrl(`${BLOB}/logos/a.png`, 'logos'), `${BLOB}/logos/a.png`);
  assert.equal(blobUrl(`${BLOB}/logos/a.png`, 'profile'), null);
  assert.equal(blobUrl('javascript:alert(1)', 'logos'), null);
});

test('profile photos validate the same way', () => {
  assert.deepEqual(validateProfile({ photoUrl: '' }), { ok: true, value: { photoUrl: '' } });
  assert.equal(validateProfile({ photoUrl: `${BLOB}/profile/me.jpg` }).ok, true);
  assert.equal(validateProfile({ photoUrl: `${BLOB}/logos/me.jpg` }).ok, false);
  assert.equal(validateProfile({ photoUrl: 'https://example.com/me.jpg' }).ok, false);
});

test('upload kinds: images only for logos and photos, no prototype tricks', () => {
  assert.ok(uploadRule('certificate').types.includes('application/pdf'));
  assert.ok(!uploadRule('logo').types.includes('application/pdf'));
  assert.ok(!uploadRule('photo').types.includes('application/pdf'));
  assert.equal(uploadRule('logo').folder, 'logos');
  assert.equal(uploadRule('photo').folder, 'profile');
  assert.equal(uploadRule('nope'), null);
  assert.equal(uploadRule('constructor'), null);
  assert.equal(uploadRule('__proto__'), null);
});
