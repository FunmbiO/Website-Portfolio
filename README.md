# FunmbiO — Portfolio

Personal portfolio of FunmbiO: a web developer who builds convenience.
Static HTML, CSS and vanilla JS, plus a small set of Vercel serverless functions for
the certifications backend. Deployed on Vercel. No build step.

## What's on the page

- **Live preview** — Jaded Media and Edgeline Exports loaded in a scaled frame, with a desktop and mobile toggle
- **Work** — three cards (Jaded Media, Edgeline Exports and this site), each with the skills it shows and a link to its case study
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

Neo-brutalist: heavy italic uppercase type with outlined second words, thick black borders, hard offset
shadows, a black frame and halftone texture on the hero. Deep sage and black are the main colours.
Colours and fonts are CSS variables at the top of `styles.css`.

| Token | Hex | Used for |
| --- | --- | --- |
| `--black` | `#0B0B0B` | Main dark ground, borders, primary buttons |
| `--night` | `#111312` | Panels and alternate dark bands |
| `--sage` | `#80907A` | Main light ground: nav, hero, project cards, contact |
| `--sage-3` | `#B7C1AF` | Tech stack panel |
| `--green` / `--green-hi` | `#06281E` / `#3F9E7B` | Deep green marks: live dots, focus ring, top line |
| `--burgundy` | `#590907` | Hard shadows and thin section rules |

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
