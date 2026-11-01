# FunmbiO — Portfolio

Personal portfolio of FunmbiO: web developer and founder of Jaded Media.
Static HTML, CSS and a little vanilla JS, deployed on Vercel. No build step.

## What's on the page

- **Live preview** — Jaded Media and Edgeline Exports loaded in a scaled frame, with a desktop and mobile toggle
- **Work** — the two live builds, with role and stack
- **About, What I do, Toolkit** — short, factual sections
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
