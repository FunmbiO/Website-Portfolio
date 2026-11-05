import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'https://jaded-works.vercel.app';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// JSON inside a <script> must not be able to close it or open a comment.
export const jsonForScript = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

export function loadProjects() {
  return JSON.parse(readFileSync(path.join(ROOT, 'data/projects.json'), 'utf8'));
}

const isExternal = (u) => /^https?:\/\//.test(u);

export function renderProject(p, all) {
  const i = all.findIndex((x) => x.slug === p.slug);
  const next = all[(i + 1) % all.length];
  const title = `${p.name} — case study | FunmbiO`;
  const desc = `${p.name}: ${p.kind}. ${p.role}. Skills shown: ${p.skills.map((g) => g.group).join(', ')}.`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.name,
    description: p.summary,
    creator: { '@type': 'Person', name: 'FunmbiO', url: SITE },
    url: `${SITE}/work/${p.slug}`,
    keywords: p.stack.join(', '),
  };
  const live = isExternal(p.url)
    ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">Visit ${esc(p.urlLabel)} ↗</a>`
    : `<a class="btn" href="/">Back to the home page →</a>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/work/${esc(p.slug)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(p.summary)}">
<meta property="og:type" content="article">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1C0504">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800;900&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Hanken+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${jsonForScript(ld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="nav">
  <div class="wrap">
    <a class="brand" href="/">Funmbi<span>/</span>O</a>
    <nav aria-label="Primary">
      <ul>
        <li><a href="/#work" aria-current="page">Work</a></li>
        <li><a href="/certifications" class="nav-cert">Certifications</a></li>
        <li class="hide-sm"><a href="/#about">About</a></li>
        <li class="hide-sm"><a href="/#toolkit">Toolkit</a></li>
        <li><a class="btn sm" href="/#contact">Say hello →</a></li>
      </ul>
    </nav>
  </div>
</header>

<main id="main">
  <article class="wrap case">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/#work">Work</a><span aria-hidden="true">/</span><span>${esc(p.name)}</span></nav>
    <div class="case-head">
      <div class="eyebrow">${esc(p.kind)}</div>
      <h1>${esc(p.name)}</h1>
      <p class="lede">${esc(p.summary)}</p>
      <dl class="case-facts">
        <div><dt>My role</dt><dd>${esc(p.role)}</dd></div>
        <div><dt>Built with</dt><dd>${p.stack.map(esc).join(' · ')}</dd></div>
      </dl>
      <div class="hero-actions">${live}<a class="btn ghost" href="/#work">All work</a></div>
    </div>

    <section class="case-block" aria-labelledby="h-skills">
      <h2 id="h-skills">Skills shown</h2>
      <div class="skill-grid">
${p.skills.map((g) => `        <div class="skill"><h3>${esc(g.group)}</h3><ul>${g.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div>`).join('\n')}
      </div>
    </section>

    <section class="case-block" aria-labelledby="h-notes">
      <h2 id="h-notes">What's in it</h2>
      <ul class="notes">
${p.highlights.map((h) => `        <li>${esc(h)}</li>`).join('\n')}
      </ul>
    </section>

    <nav class="case-next" aria-label="Next project">
      <span class="mono">Next project</span>
      <a href="/work/${esc(next.slug)}">${esc(next.name)} →</a>
    </nav>
  </article>
</main>

<footer class="foot">
  <div class="wrap">
    <div class="foot-brand">
      <a class="brand" href="/">Funmbi<span>/</span>O</a>
      <p>Web developer and founder of Jaded Media.<br>© <span id="year">2026</span> FunmbiO</p>
    </div>
    <div class="foot-cols">
      <div><span>EXPLORE</span><a href="/#work">Work</a><a href="/certifications">Certifications</a><a href="/#about">About</a></div>
      <div><span>CONTACT</span><a href="mailto:funmbiolajubu@gmail.com">Email</a><a href="https://github.com/FunmbiO" target="_blank" rel="noopener">GitHub</a></div>
    </div>
  </div>
</footer>
<script src="/js/common.js" defer></script>
</body>
</html>
`;
}

export function renderSitemap(all) {
  const urls = ['/', '/certifications', ...all.map((p) => `/work/${p.slug}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u === '/' ? '/' : u}</loc></url>`).join('\n')}\n</urlset>\n`;
}

export function build() {
  const all = loadProjects();
  mkdirSync(path.join(ROOT, 'work'), { recursive: true });
  for (const p of all) writeFileSync(path.join(ROOT, 'work', `${p.slug}.html`), renderProject(p, all));
  writeFileSync(path.join(ROOT, 'sitemap.xml'), renderSitemap(all));
  return all.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(`built ${build()} case studies`);
