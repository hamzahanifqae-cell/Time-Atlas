# Deployment

TimeAtlas has **no backend**: `npm run build` produces a static site (Astro's static output
in `dist/`) — plain HTML, CSS, JS, and the data/texture files in `public/`. Any static file
host works. No Node.js server is required to run the public site.

## Why no backend

Every requirement that could have motivated one is handled client-side:

- Search, clocks, comparisons and the globe all run in the browser.
- Saved preferences live in the browser's own local storage — there is nothing to persist
  server-side.
- There's no paid or rate-limited third-party API to proxy or hide a key for.

If that ever changes (e.g. a future feature genuinely needs server-side state), the project
brief for this site requires that decision to be documented explicitly, with the concrete
reason, rather than added as an afterthought.

## Build

```bash
npm install
PUBLIC_SITE_ORIGIN=https://your-real-domain.example \
PUBLIC_OPERATOR_NAME="Your Org Name" \
PUBLIC_CONTACT_EMAIL=you@your-real-domain.example \
npm run build
```

(Or put those three in a `.env` file — see `.env.example` — and just run `npm run build`.)
Output is a static site in `dist/`.

The build **fails on purpose** if those three variables are missing or malformed — see
`RELEASE_CHECKLIST.md`.

## Hosting

Upload the contents of `dist/` to any static host — for example:

- **Netlify / Vercel / Cloudflare Pages:** connect the repo, set the build command to
  `npm run build` and the output directory to `dist`, and set the three `PUBLIC_*` env vars
  (above) in the host's project settings.
- **A plain object-storage + CDN setup** (S3+CloudFront, Cloudflare R2, GCS, etc.): upload
  `dist/` and serve it; make sure your host serves `dist/404.html` as the 404 response, and
  serves `.geojson`/`.json` under `public/data/` with a reasonable `Content-Type` and caching
  headers (they're content-hashed-by-path already via the data-build scripts' fixed
  filenames, so set a moderate cache lifetime, not immutable/forever, since re-running
  `npm run data:build` can change their contents without changing the filename).
- **A plain web server** (nginx, Caddy, etc.): point the document root at `dist/`.

## Real-world costs this does **not** waive

"No paid APIs" describes the software, not the cost of running it. You will still need, and
pay for, in the ordinary way:

- **Hosting and bandwidth** for the static files (including the ~1–4 MB of geographic data
  and Earth textures, fetched once per visitor and cacheable thereafter).
- **A real domain name**, if you want one (the production build requires an HTTPS origin —
  see below).
- Nothing else. There is no database, no compute beyond serving static files, and no
  recurring API billing.

## Staging vs. production

Set `PUBLIC_STAGING=true` to build a staging deployment: it adds a global `noindex` directive,
a visible staging banner, and a `Disallow: /` in `robots.txt`. **This is not a security
control** — it only asks well-behaved search engines not to index the page; it does not
password-protect anything or stop someone with the URL from viewing it. If a staging
deployment needs to be actually private, put real access control in front of it (e.g. your
host's password-protection/signed-URL feature), not just `noindex`.

Leave `PUBLIC_STAGING` unset (or `false`) for the real public launch, and double check the
built `dist/robots.txt` says `Allow: /` with no `Disallow`, and that pages don't carry a
`noindex` meta tag — see `RELEASE_CHECKLIST.md`.

## Required production environment variables

See `.env.example` for the authoritative list and validation rules (also enforced by
`npm run release:check`):

| Variable | Required for `npm run build`? | Notes |
|---|---|---|
| `PUBLIC_SITE_ORIGIN` | Yes | Bare `https://` origin, no path/query/fragment/credentials, not localhost/an IP/a reserved example-test domain. |
| `PUBLIC_OPERATOR_NAME` | Yes | Shown on About/Privacy/Terms. |
| `PUBLIC_CONTACT_EMAIL` | Yes | Shown on Contact/Privacy. Only syntax is validated — this does not confirm the address can receive mail. |
| `PUBLIC_STAGING` | No (default `false`) | See above. |

`npm run build:local` skips all of the above, for building/previewing locally without real
production configuration.
