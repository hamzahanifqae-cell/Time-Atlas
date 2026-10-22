# TimeAtlas

**Explore the world. Find your time.**

A world-clock site: search a city or country, compare local times, and explore an
interactive 3D Earth. Built with Astro, React, Tailwind CSS, and Three.js. No paid APIs, no
backend, no user accounts — search, clocks, comparisons and the globe
all run in the browser, using self-hosted, permissively-licensed data (see
[DATA_SOURCES.md](./DATA_SOURCES.md)).

## Requirements

- Node.js 22.23.4 or newer (the version this was built and tested against).

## Install

```bash
npm install
```

## Develop

```bash
npm run dev
```

Starts the Astro dev server at `http://localhost:4321`. No `.env` file is required for local
development.

## Test

```bash
npm run test          # run the test suite once
npm run test:watch    # watch mode
npm run typecheck     # astro check (TypeScript + Astro template diagnostics)
```

## Build

TimeAtlas has two build modes:

```bash
npm run build:local   # local-only build: skips the production-config requirement
npm run build         # standard production build: FAILS if production config is missing/invalid
```

The standard build (`npm run build`) requires `PUBLIC_SITE_ORIGIN`, `PUBLIC_OPERATOR_NAME`,
and `PUBLIC_CONTACT_EMAIL` to be set (in `.env` or the environment) and well-formed — see
[.env.example](./.env.example) and [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md). This is
intentional: it stops a real production deploy from accidentally going out with placeholder
or missing operator/contact information. `npm run build:local` is for previewing a production
build locally without supplying that configuration.

## Preview a production build locally

```bash
npm run build:local
npm run preview
```

## Release readiness check

```bash
npm run release:check
```

Validates the real `.env` configuration (origin, operator name, contact email) without doing
a full build — useful as a pre-deploy gate. See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md).

## Rebuilding the geographic/city data

The city, country, time-zone, and boundary data shipped in `public/data/` and the Earth
textures in `public/textures/` are generated from third-party sources, not hand-written. To
rebuild them from scratch:

```bash
npm run data:fetch   # downloads raw sources into data/raw/ (gitignored)
npm run data:build   # processes data/raw/ into public/data/ and public/textures/
```

See [DATA_SOURCES.md](./DATA_SOURCES.md) for exactly what each source is, its license, and
the methodology used to build the shipped dataset (including a couple of data-quality issues
found and fixed while building this pipeline — worth reading before changing it).

## Project structure

```
src/
  components/   React islands (search, clocks, globe, …)
  config/       Typed site configuration + its validation (shared by Astro config and
                scripts/release-check.mjs)
  content/      (reserved for future content collections)
  layouts/      Shared Astro page layout
  lib/          Framework-agnostic logic: time engine, search, geo math, storage
  pages/        Astro routes
  stores/       Cross-island shared state (nanostores)
scripts/
  data/         The data-build pipeline described above
  release-check.mjs
test/           Vitest test suite
public/
  data/         Generated city/country/boundary JSON (static, fetched at runtime)
  textures/     Generated Earth textures
```

## Deployment

TimeAtlas is a static site (Astro's static output) with no backend — see
[DEPLOYMENT.md](./DEPLOYMENT.md) for hosting instructions and real-world cost notes (static
hosting is not free merely because no paid API is involved).

## What's implemented, and what isn't verified

See the end of this project's delivery summary (provided alongside this repository) for a
full feature list, the tests that were run, and — importantly — an honest list of things that
were **not** verified in an actual browser, since no browser-automation tool was available
while building this.

## License notes

This repository's own code has no license file added — add one appropriate to your
intended use before any public release. Third-party data and assets each carry their own
license; see [DATA_SOURCES.md](./DATA_SOURCES.md).
