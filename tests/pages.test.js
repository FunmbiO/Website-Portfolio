import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadProjects, renderProject, esc } from '../scripts/build-pages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projects = loadProjects();

test('every project has the fields the template needs', () => {
  for (const p of projects) {
    for (const k of ['slug', 'name', 'role', 'kind', 'url', 'summary']) assert.ok(p[k], `${p.slug} missing ${k}`);
    assert.ok(p.stack.length > 0 && p.skills.length > 0 && p.highlights.length > 0, `${p.slug} is empty somewhere`);
    assert.match(p.slug, /^[a-z0-9-]+$/);
  }
});

test('rendered pages show the name, role, skills and a canonical link', () => {
  for (const p of projects) {
    const html = renderProject(p, projects);
    assert.ok(html.includes(`<h1>${esc(p.name)}</h1>`));
    assert.ok(html.includes(esc(p.role)));
    assert.ok(html.includes('Skills shown'));
    assert.ok(html.includes(`rel="canonical" href="https://jaded-works.vercel.app/work/${p.slug}"`));
    for (const g of p.skills) assert.ok(html.includes(esc(g.group)));
  }
});

test('text from the data is escaped', () => {
  const evil = { ...projects[0], name: '<img src=x onerror=alert(1)>', summary: '"quoted" & <b>bold</b>' };
  const html = renderProject(evil, [evil, ...projects.slice(1)]);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x'));
});

test('committed pages match the data (run: node scripts/build-pages.mjs)', () => {
  for (const p of projects) {
    const file = path.join(ROOT, 'work', `${p.slug}.html`);
    assert.ok(existsSync(file), `${file} is missing`);
    assert.equal(readFileSync(file, 'utf8'), renderProject(p, projects), `${p.slug}.html is out of date`);
  }
});
