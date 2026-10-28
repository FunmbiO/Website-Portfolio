# Jaded Works

A portfolio of sites built and shipped by FunmbiO. It is a website in itself:
static HTML, CSS and a little vanilla JS, deployed on Vercel. No build step.

## Featured work

- **Jaded Media** — media business site
- **Edgeline Exports** — export business site

## Develop

```sh
python3 -m http.server 3000
```

Open http://localhost:3000.

## Deploy

Vercel serves the repo root as a static site (`vercel.json` sets clean URLs and
cache headers). Every push to a branch gets a preview deployment; `main` is production.

## Palette

Colours live as CSS variables at the top of `styles.css`.

| Token | Hex | Used for |
| --- | --- | --- |
| `--sage` | `#A5A79B` | Muted text, hairlines, contact block |
| `--cream` | `#E8D2B5` | Buttons, headline accents, light band |
| `--burgundy` | `#590907` | Surfaces, hover states, hero slab |
| `--bg` | `#1C0504` | Page background (darkened burgundy) |
