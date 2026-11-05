import { put, head } from '@vercel/blob';

const PATH = 'certifications.json';

// An empty store is normal on day one; the SDK words this a few different ways.
export function isBlobNotFound(err) {
  return err?.name === 'BlobNotFoundError' || /does not exist|not.?found/i.test(err?.message || '');
}

export async function readAll() {
  try {
    const meta = await head(PATH);
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`blob read failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (isBlobNotFound(err)) return [];
    throw err;
  }
}

export async function writeAll(items) {
  await put(PATH, JSON.stringify(items), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}
