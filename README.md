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
