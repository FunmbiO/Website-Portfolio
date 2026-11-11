import { randomBytes } from 'node:crypto';
import { put } from '@vercel/blob';
import { isAuthed, looksLikeOwnFetch } from '../_lib/auth.js';
import { allow, send } from '../_lib/http.js';
import { ALLOWED_UPLOADS, detectType, safeFilename, uploadRule } from '../_lib/validate.js';

async function readBody(req, max) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max + 1024) throw Object.assign(new Error('too large'), { code: 'TOO_LARGE' });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const mb = (n) => `${Math.round(n / (1024 * 1024))} MB`;

// The admin page sends the raw file bytes as application/octet-stream.
// ?kind=certificate (default) | logo | photo decides the rules and the folder.
export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  if (!isAuthed(req)) return send(res, 401, { error: 'Sign in first.' });
  if (!looksLikeOwnFetch(req)) return send(res, 403, { error: 'Forbidden' });

  const rule = uploadRule(String(req.query?.kind || 'certificate'));
  if (!rule) return send(res, 400, { error: 'Unknown upload type.' });

  try {
    const body = await readBody(req, rule.max);
    if (body.length > rule.max) return send(res, 413, { error: `File is larger than ${mb(rule.max)}.` });
    const type = detectType(body);
    if (!type || !rule.types.includes(type)) return send(res, 415, { error: `Upload ${rule.hint}.` });

    const name = safeFilename(String(req.query?.name || ''), ALLOWED_UPLOADS[type], rule.fallbackName);
    const blob = await put(`${rule.folder}/${randomBytes(6).toString('hex')}-${name}`, body, {
      access: 'public',
      contentType: type,
      addRandomSuffix: false,
    });
    send(res, 201, { url: blob.url, fileName: name, type });
  } catch (err) {
    if (err?.code === 'TOO_LARGE') return send(res, 413, { error: `File is larger than ${mb(rule.max)}.` });
    console.error('upload failed', err?.message);
    send(res, 500, { error: 'Upload failed. Try again.' });
  }
}
