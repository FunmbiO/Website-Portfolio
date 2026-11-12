# FunmbiO — Portfolio

Personal portfolio of FunmbiO: a web developer who builds convenience.
Static HTML, CSS and vanilla JS, plus a small set of Vercel serverless functions for
the certifications backend. Deployed on Vercel. No build step.

## What's on the page

- **Live preview** — Jaded Media, Edgeline Exports, NitroDrp and the Opus demo loaded in a scaled frame, with a desktop and mobile toggle
- **Work** — five cards (Jaded Media, Edgeline Exports, NitroDrp, Opus and this site), each with the skills it shows and a link to its case study
- **Case studies** — `/work/<slug>`, generated from `data/projects.json`
- **About, What I do, Toolkit** — short, factual sections
- **Certifications** — a dedicated page plus a featured block on the home page, each entry linking to the official certificate
- **Contact** — email link

## Editing projects and case studies

Project details live in `data/projects.json` (role, stack, highlights, skills shown).
After editing it, regenerate the pages and the sitemap, then commit the result:

```sh
node scripts/build-pages.mjs
npm test
```

A test fails if the committed `work/*.html` or `sitemap.xml` are out of date.

## Develop

```sh
python3 -m http.server 3000
```

Open http://localhost:3000.

## Live previews and framing

The previews are iframes of the live sites. A site only appears if it allows
this page in its `frame-ancestors` CSP directive. If a preview is blank, check
that site's `Content-Security-Policy` and `X-Frame-Options` headers.

## Design

Neo-brutalist: heavy italic uppercase type with outlined second words, thick borders, hard offset
shadows and halftone texture. The palette is called Night Moss: black first, one deep-green band for the
projects and contact, tangerine for buttons, burgundy for shadows and rules.
Colours and fonts are CSS variables at the top of `styles.css`.

| Token | Hex | Used for |
| --- | --- | --- |
| `--black` | `#0A0A0A` | Main ground: nav, sections, footer |
| `--night` / `--night-2` | `#130B0E` / `#1B1013` | Hero, cards and panels, tinted warm toward burgundy |
| `--moss` | `#0F3323` | The one green band: projects and contact |
| `--mark` | `#2E9468` | Small green marks: live dot, status dot |
| `--burgundy` / `--burgundy-hi` | `#650015` / `#A3173A` | Hard shadows, nav rule / thin rules that must show on black |
| `--tangerine` / `--rust` | `#FF6A1A` / `#B8420F` | Buttons, focus ring, selected tabs / button shadows |
| `--stone` | `#F2DDB4` | Project cards and the tech stack panel |
| `--paper` | `#F5F7EE` | Text on dark |

Fonts: Archivo (italic display), Hanken Grotesk (body), JetBrains Mono (small labels).

Rules the design follows, from the installed `design-taste-frontend` skill:

- Nothing moves on load or on scroll. Motion is a hover and focus layer only and is switched off under reduced motion.
- No captions or labels on visuals; text sits beside them.
- Plain headings, buttons that start with a verb, one main action (Email me) worded the same everywhere.
- Real tool logos from the CC0 SVG Logos set (see `icons-credits.json`).

## Deploy

Vercel serves the repo root as a static site (`vercel.json` sets clean URLs and
cache headers). Every push to a branch gets a preview deployment.

## Certifications backend

Certifications are stored as JSON in a Vercel Blob store (`portfolio-certificates`);
uploaded certificate files live in the same store under `certificates/`.

| Route | Who | What |
| --- | --- | --- |
| `GET /api/certs` | public | List shown on the site |
| `GET /admin` | you | Private admin page (not linked, `noindex`) |
| `POST /api/admin/login` | you | Password check, sets an HttpOnly session cookie (8 h) |
| `GET/POST/PUT/DELETE /api/admin/certs` | you | Manage entries |
| `POST /api/admin/upload?kind=` | you | Upload a file. `certificate`: PDF/PNG/JPG/WebP, 4 MB. `logo`: PNG/JPG/WebP, 2 MB. `photo`: PNG/JPG/WebP, 4 MB. Type is checked by content |
| `GET /api/profile` | public | The profile photo address the site shows |
| `GET/PUT /api/admin/profile` | you | Read or change the profile photo |

### Profile photo and issuer logos

- **Profile photo:** in `/admin`, the Profile photo panel at the top. Pick an image and it uploads, shrinks to 1600 px if needed, and appears in the About section within a minute. Until you upload one, nothing is shown there.
- **Issuer logo:** the certification form has an Issuer logo field (PNG, JPG or WebP, shrunk to 400 px). Type an issuer you've already used and its logo is attached automatically, so each company's logo is uploaded once. Logos show on every certification card.

### Setup

1. In the Vercel project, add an environment variable `ADMIN_PASSWORD` (12+ characters, mark it Sensitive).
2. The Blob store adds `BLOB_READ_WRITE_TOKEN` automatically when connected to the project.
3. Redeploy, open `/admin`, sign in and add certifications.

Until `ADMIN_PASSWORD` is set the admin page shows a setup notice and no one can sign in.

### Checks

```sh
npm install
npm test
```
