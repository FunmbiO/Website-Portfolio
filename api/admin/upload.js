import { randomBytes } from 'node:crypto';
import { put } from '@vercel/blob';
import { isAuthed, looksLikeOwnFetch } from '../_lib/auth.js';
import { allow, send } from '../_lib/http.js';
import { ALLOWED_UPLOADS, MAX_UPLOAD_BYTES, detectType, safeFilename } from '../_lib/validate.js';

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_UPLOAD_BYTES + 1024) throw Object.assign(new Error('too large'), { code: 'TOO_LARGE' });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// The admin page sends the raw file bytes as application/octet-stream.
export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  if (!isAuthed(req)) return send(res, 401, { error: 'Sign in first.' });
  if (!looksLikeOwnFetch(req)) return send(res, 403, { error: 'Forbidden' });

  try {
    const body = await readBody(req);
    if (body.length > MAX_UPLOAD_BYTES) return send(res, 413, { error: 'File is larger than 4 MB.' });
    const type = detectType(body);
    if (!type || !ALLOWED_UPLOADS[type]) return send(res, 415, { error: 'Upload a PDF, PNG, JPG or WebP file.' });

    const name = safeFilename(String(req.query?.name || ''), ALLOWED_UPLOADS[type]);
    const blob = await put(`certificates/${randomBytes(6).toString('hex')}-${name}`, body, {
      access: 'public',
      contentType: type,
      addRandomSuffix: false,
    });
    send(res, 201, { url: blob.url, fileName: name, type });
  } catch (err) {
    if (err?.code === 'TOO_LARGE') return send(res, 413, { error: 'File is larger than 4 MB.' });
    console.error('upload failed', err?.message);
    send(res, 500, { error: 'Upload failed. Try again.' });
  }
}
