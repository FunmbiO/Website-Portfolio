import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadProjects } from '../scripts/build-pages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const home = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const config = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const csp = config.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy').value;
const frameSrc = /frame-src ([^;]*)/.exec(csp)[1].split(/\s+/);

test('every project has a card on the home page that links to its case study', () => {
  for (const p of loadProjects()) {
    assert.ok(home.includes(`href="/work/${p.slug}"`), `${p.slug} has no case-study link on the home page`);
    assert.ok(home.includes(`<h3>${p.name}</h3>`), `${p.name} has no card heading on the home page`);
  }
});

test('every external site framed on the home page is allowed by the security policy', () => {
  const origins = new Set();
  for (const m of home.matchAll(/data-(?:src|href)="(https:\/\/[^"/]+)/g)) origins.add(m[1]);
  assert.ok(origins.size >= 3, 'expected the live sites to be framed');
  for (const o of origins) assert.ok(frameSrc.includes(o), `${o} is framed on the home page but missing from frame-src`);
});

test('the hero preview has a tab and a frame for each live site', () => {
  const tabs = [...home.matchAll(/data-target="([a-z-]+)"/g)].map((m) => m[1]);
  const frames = [...home.matchAll(/data-site="([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...tabs].sort(), [...frames].sort());
  assert.ok(tabs.includes('nitrodrp'));
});

test('the live-build count in the hero matches the number of live frames', () => {
  const live = [...home.matchAll(/data-site="/g)].length;
  assert.ok(home.includes(`${live} of those builds are live`), `hero should say ${live} builds are live`);
  assert.ok(home.includes(`${live} builds live`), `hero chip should say ${live} builds live`);
});

test('the Opus demo is framed with the embed flag and a minimal sandbox, and links to its repo', () => {
  assert.ok(home.includes('data-src="https://opus-lake.vercel.app/?embed=1"'), 'hero frame should load the embed view');
  assert.ok(home.includes('<iframe title="Opus live demo"'), 'work card thumbnail is missing');
  assert.match(home, /data-site="opus"[^>]*sandbox="allow-scripts allow-same-origin"/);
  assert.ok(frameSrc.includes('https://opus-lake.vercel.app'));
  assert.ok(!frameSrc.some((o) => o.includes('*')), 'frame-src must not use wildcards');
  assert.ok(home.includes('https://github.com/FunmbiO/Opus'));
});
