import { put, head } from '@vercel/blob';

// An empty store is normal on day one; the SDK words this a few different ways.
export function isBlobNotFound(err) {
  return err?.name === 'BlobNotFoundError' || /does not exist|not.?found/i.test(err?.message || '');
}

export async function readJson(path, fallback) {
  try {
    const meta = await head(path);
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`blob read failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (isBlobNotFound(err)) return fallback;
    throw err;
  }
}

export async function writeJson(path, data) {
  await put(path, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export async function readAll() {
  const data = await readJson('certifications.json', []);
  return Array.isArray(data) ? data : [];
}
export const writeAll = (items) => writeJson('certifications.json', items);

export async function readProfile() {
  const data = await readJson('profile.json', {});
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}
export const writeProfile = (profile) => writeJson('profile.json', profile);
