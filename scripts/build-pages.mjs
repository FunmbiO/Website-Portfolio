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
<meta name="theme-color" content="#80907A">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,700;0,800;0,900;1,300;1,700;1,800;1,900&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${jsonForScript(ld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="topline"></div>
<header class="nav">
  <div class="wrap">
    <a class="brand" href="/" aria-label="FunmbiO, home"><b>Funmbi</b><span>Portfolio</span></a>
    <nav aria-label="Primary">
      <ul>
        <li><a href="/#work" aria-current="page">Projects</a></li>
        <li><a href="/certifications">Certifications</a></li>
        <li class="hide-sm"><a href="/#about">About</a></li>
        <li class="hide-sm"><a href="/#services">Services</a></li>
        <li class="hide-sm"><a href="/#contact">Contact</a></li>
        <li class="hide-sm slash" aria-hidden="true">/</li>
        <li class="hide-sm"><a class="icon-link" href="https://github.com/FunmbiO" target="_blank" rel="noopener" aria-label="GitHub"><img src="/assets/icons/github.svg" alt="" width="20" height="20"></a></li>
        <li><a class="btn sm" href="mailto:funmbiolajubu@gmail.com?subject=Hello">Email me <i>[ ↗ ]</i></a></li>
      </ul>
    </nav>
  </div>
</header>

<main id="main">
  <section class="case-hero halftone">
    <div class="wrap case-page">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/#work">Projects</a><span aria-hidden="true">/</span><span>${esc(p.name)}</span></nav>
      <div class="case-head">
        <span class="tagchip">${esc(p.kind)}</span>
        <h1>${esc(p.name)}</h1>
        <p class="lede">${esc(p.summary)}</p>
        <dl class="case-facts">
          <div><dt>My role</dt><dd>${esc(p.role)}</dd></div>
          <div><dt>Built with</dt><dd>${p.stack.map(esc).join(' · ')}</dd></div>
        </dl>
        <div class="hero-actions">${live}<a class="btn ghost" href="/#work">All projects</a></div>
      </div>
    </div>
  </section>

  <section class="ground ground-black">
    <div class="wrap case-page">
      <section class="case-block" aria-labelledby="h-skills">
        <div class="sec-title"><h2 id="h-skills">Skills <span class="out">shown</span></h2><i class="rule"></i></div>
        <div class="skill-grid">
${p.skills.map((g) => `          <div class="skill"><h3>${esc(g.group)}</h3><ul>${g.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div>`).join('\n')}
        </div>
      </section>

      <section class="case-block" aria-labelledby="h-notes">
        <div class="sec-title"><h2 id="h-notes">What's <span class="out">in it</span></h2><i class="rule"></i></div>
        <ul class="notes">
${p.highlights.map((h) => `          <li>${esc(h)}</li>`).join('\n')}
        </ul>
      </section>

      <nav class="case-next" aria-label="Next project">
        <span class="mono">Next project</span>
        <a href="/work/${esc(next.slug)}">${esc(next.name)} →</a>
      </nav>
    </div>
  </section>
</main>

<footer class="site-foot">
  <div class="wrap">
    <div class="legal">
      <span>Open to projects</span>
      <span>© <span id="year">2026</span> FunmbiO</span>
      <span><a href="/#work">Projects</a> · <a href="/certifications">Certifications</a> · <a href="https://github.com/FunmbiO" target="_blank" rel="noopener">GitHub</a></span>
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
