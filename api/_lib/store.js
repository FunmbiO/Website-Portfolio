import { put, head } from '@vercel/blob';

const PATH = 'certifications.json';

export async function readAll() {
  try {
    const meta = await head(PATH);
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`blob read failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err?.name === 'BlobNotFoundError' || /not.?found/i.test(err?.message || '')) return [];
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
