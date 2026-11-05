import test from 'node:test';
import assert from 'node:assert/strict';
import { isBlobNotFound } from '../api/_lib/store.js';

test('an empty store is recognised however the SDK words it', () => {
  assert.equal(isBlobNotFound({ name: 'BlobNotFoundError' }), true);
  assert.equal(isBlobNotFound(new Error('Vercel Blob: The requested blob does not exist')), true);
  assert.equal(isBlobNotFound(new Error('Vercel Blob: Not found')), true);
});

test('real failures are not mistaken for an empty store', () => {
  assert.equal(isBlobNotFound(new Error('Vercel Blob: Access denied, please provide a valid token')), false);
  assert.equal(isBlobNotFound(new Error('fetch failed')), false);
  assert.equal(isBlobNotFound(undefined), false);
});
