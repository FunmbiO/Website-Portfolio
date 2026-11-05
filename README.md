# FunmbiO — Portfolio

Personal portfolio of FunmbiO: web developer and founder of Jaded Media.
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

A terminal / code-editor look: JetBrains Mono everywhere, square corners, 1 px borders, flat grounds.
Colours are CSS variables at the top of `styles.css`.

| Token | Hex | Used for |
| --- | --- | --- |
| `--bg` | `#110C08` | Page background (deep brown-black) |
| `--green` | `#0D3B2C` | Certifications band and toolkit cards (deep green) |
| `--green-2` | `#14573F` | Primary buttons and selected tabs |
| `--brown-2` | `#2C1D12` | Services band (deep brown) |
| `--sage` | `#A5A79B` | Projects and toolkit bands |
| `--cream` | `#E8D2B5` | Approach band, headings accents |
| `--black` | `#0A0A0A` | Nav, footer, preview frame |
| `--burgundy` | `#590907` | Reserved; not used on the page |

Rules the design follows, from the installed `design-taste-frontend` skill and `DESIGN.md`:

- Nothing moves on load or on scroll. Motion is a hover and focus layer only (2 px card lift, 1 px button step, drawn underlines, 2 px focus ring) and is switched off under reduced motion.
- Flat grounds, with one faint grid behind the hero. Grounds alternate dark, green, sage, dark, cream, brown, sage, dark.
- No captions or labels on visuals; text sits beside them.
- Plain noun headings, buttons that start with a verb, and one main action (Email me) worded the same everywhere.
- Real tool logos from the CC0 SVG Logos set (see `icons-credits.json`), shown on cream chips.

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
| `POST /api/admin/upload` | you | Upload a PDF/PNG/JPG/WebP (4 MB max, type checked by content) |

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
