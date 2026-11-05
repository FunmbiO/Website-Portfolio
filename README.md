# FunmbiO — Portfolio

Personal portfolio of FunmbiO: web developer and founder of Jaded Media.
Static HTML, CSS and vanilla JS, plus a small set of Vercel serverless functions for
the certifications backend. Deployed on Vercel. No build step.

## What's on the page

- **Live preview** — Jaded Media and Edgeline Exports loaded in a scaled frame, with a desktop and mobile toggle
- **Work** — the two live builds, with role and stack
- **About, What I do, Toolkit** — short, factual sections
- **Certifications** — a dedicated page plus a featured block on the home page, each entry linking to the official certificate
- **Contact** — email link

## Develop

```sh
python3 -m http.server 3000
```

Open http://localhost:3000.

## Live previews and framing

The previews are iframes of the live sites. A site only appears if it allows
this page in its `frame-ancestors` CSP directive. If a preview is blank, check
that site's `Content-Security-Policy` and `X-Frame-Options` headers.

## Palette

Colours are CSS variables at the top of `styles.css`.

| Token | Hex | Used for |
| --- | --- | --- |
| `--sage` | `#A5A79B` | Section bands, muted text, hairlines |
| `--cream` | `#E8D2B5` | Buttons, headline accents, toolkit band |
| `--burgundy` | `#590907` | Surfaces, hover states, hero slab |
| `--bg` | `#1C0504` | Page background |
| `--black` | `#0A0A0A` | Nav, strip, footer, cards |

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
