const BLOB_HOST = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;
const DATE = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;

// A file we stored ourselves: our blob host, and the right folder inside it.
export function blobUrl(v, folder) {
  const s = typeof v === 'string' ? v.trim().slice(0, 500) : '';
  if (!s) return '';
  if (!BLOB_HOST.test(s)) return null;
  try {
    return new URL(s).pathname.startsWith(`/${folder}/`) ? s : null;
  } catch {
    return null;
  }
}

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function httpsUrl(v) {
  const s = clean(v, 500);
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export function validateCert(input) {
  const errors = [];
  const title = clean(input?.title, 140);
  const issuer = clean(input?.issuer, 100);
  const issuedOn = clean(input?.issuedOn, 10);
  const expiresOn = clean(input?.expiresOn, 10);
  const credentialId = clean(input?.credentialId, 100);
  const description = clean(input?.description, 600);
  const fileName = clean(input?.fileName, 120);

  if (!title) errors.push('Title is required.');
  if (!issuer) errors.push('Issuer is required.');
  if (!DATE.test(issuedOn)) errors.push('Issue date must look like 2026-03 or 2026-03-15.');
  if (expiresOn && !DATE.test(expiresOn)) errors.push('Expiry date must look like 2028-03 or 2028-03-15.');

  const verifyUrl = httpsUrl(input?.verifyUrl);
  if (verifyUrl === null) errors.push('Verification link must be a full https:// address.');

  const fileUrl = blobUrl(input?.fileUrl, 'certificates');
  if (fileUrl === null) errors.push('Certificate file must be uploaded through the admin page.');

  const logoUrl = blobUrl(input?.logoUrl, 'logos');
  if (logoUrl === null) errors.push('Logo must be uploaded through the admin page.');

  if (!verifyUrl && !fileUrl) errors.push('Add a verification link, an uploaded certificate, or both.');

  const skills = Array.isArray(input?.skills)
    ? [...new Set(input.skills.map((s) => clean(s, 40)).filter(Boolean))].slice(0, 12)
    : [];

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title, issuer, issuedOn,
      expiresOn: expiresOn || '',
      credentialId,
      verifyUrl: verifyUrl || '',
      fileUrl: fileUrl || '',
      fileName: fileUrl ? fileName : '',
      logoUrl: logoUrl || '',
      skills,
      description,
      featured: input?.featured === true,
    },
  };
}

export const ALLOWED_UPLOADS = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const IMAGES = ['image/png', 'image/jpeg', 'image/webp'];
const MB = 1024 * 1024;
// What each kind of upload may be, where it is stored and how big it can get.
export const UPLOAD_KINDS = {
  certificate: { folder: 'certificates', types: ['application/pdf', ...IMAGES], max: 4 * MB, hint: 'a PDF, PNG, JPG or WebP file', fallbackName: 'certificate' },
  logo: { folder: 'logos', types: IMAGES, max: 2 * MB, hint: 'a PNG, JPG or WebP image', fallbackName: 'logo' },
  photo: { folder: 'profile', types: IMAGES, max: 4 * MB, hint: 'a PNG, JPG or WebP image', fallbackName: 'photo' },
};
export const uploadRule = (kind) => (Object.hasOwn(UPLOAD_KINDS, kind) ? UPLOAD_KINDS[kind] : null);

export function validateProfile(input) {
  const photoUrl = blobUrl(input?.photoUrl, 'profile');
  if (photoUrl === null) return { ok: false, errors: ['Photo must be uploaded through the admin page.'] };
  return { ok: true, value: { photoUrl: photoUrl || '' } };
}

export function safeFilename(name, ext, fallback = 'certificate') {
  const base = clean(name, 80).replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return `${base || fallback}.${ext}`;
}

// Newest first; featured certificates float to the top of the home page list.
export function sortCerts(items) {
  return [...items].sort((a, b) => (b.issuedOn || '').localeCompare(a.issuedOn || ''));
}

// Identify the file from its first bytes instead of trusting the name or header.
export function detectType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}
