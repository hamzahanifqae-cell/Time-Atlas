# Release checklist

## Real details you (the operator) still need to supply

Nothing below was invented — these are genuinely unset, and the build will fail (by design)
until they're real:

1. **A real production domain** — set as `PUBLIC_SITE_ORIGIN` (bare `https://` origin).
   TimeAtlas does not register domains or set up DNS/HTTPS for you.
2. **Your/your organization's real name** — `PUBLIC_OPERATOR_NAME`. Shown on About, Privacy,
   and Terms.
3. **A real, monitored contact email address** — `PUBLIC_CONTACT_EMAIL`. Shown on Contact and
   Privacy. Nothing confirms it can actually receive mail — test it yourself.
4. **Legal review of `/privacy` and `/terms`.** Both are clearly marked in-page as drafts, not
   reviewed by a lawyer on your behalf. Have them reviewed (and the "Draft" banner removed,
   and the last-updated dates in `src/pages/privacy.astro` / `src/pages/terms.astro` updated)
   before a public launch — especially if you're subject to GDPR, CCPA, or similar, which this
   draft does not attempt to address.
5. **Your actual hosting provider's logging practices**, to replace the generic hosting-logs
   paragraph in `/privacy` with your host's specifics.
6. **A hosting decision and account** (Netlify/Vercel/Cloudflare Pages/a plain static host —
   see `DEPLOYMENT.md`). Nothing here provisions or pays for hosting.
7. (Optional, later) **AdSense application details**, if you pursue that — see the "AdSense"
   section below. Nothing related to ads is implemented or enabled yet.

## Launch checklist

Run these before going live:

- [ ] `npm run test` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build:local` succeeds (sanity check of the build with no production config).
- [ ] Real `.env` is in place (not committed — it's gitignored) with the three required
      `PUBLIC_*` variables, and `npm run release:check` passes against it.
- [ ] `npm run build` (the real production build, no `build:local`) succeeds using that
      `.env`.
- [ ] Inspect `dist/robots.txt`: for the real public launch it must say `Allow: /` with **no**
      `Disallow` line, and must **not** have `PUBLIC_STAGING=true` set. (If you're deploying a
      staging preview first, the opposite is correct — see `DEPLOYMENT.md`.)
- [ ] Spot-check a built page (`dist/index.html`) for the correct canonical URL and no
      unexpected `noindex` meta tag.
- [ ] `/privacy` and `/terms` have been reviewed and the "Draft" banners removed.
- [ ] `/contact` shows your real email and you've confirmed it receives mail.
- [ ] `/about` shows your real operator name.
- [ ] Manually smoke-test the live deployment in a real browser: search, select a city, select
      a multi-zone country, save a few cities to comparison, open the time explorer, and confirm the globe loads (or the 2D fallback renders if WebGL is
      unavailable on your test device). **This was not done for you as part of building this
      project — no browser-automation tool was available in that environment; see the
      delivery summary for the full list of what was and wasn't verified.**

## Readiness verdicts

- **Staging:** Ready, once you deploy with `PUBLIC_STAGING=true` and real-enough config to
  pass `npm run build` (a placeholder domain/operator/email that still passes the shape
  validation is acceptable for staging, but prefer real values even there).
- **Public, ad-free launch:** Ready once the items above are checked off — in particular,
  real domain/operator/contact, and legal review of Privacy/Terms. The product itself (search,
  clocks, comparisons, globe + 2D fallback) is functionally complete per the brief,
  with the coverage/accuracy limits documented in-app (`/guide`) rather than hidden.
- **AdSense integration:** Not ready, and not started — see below. This does not block an
  ad-free public launch; missing ad configuration never blocks anything else.

## AdSense preparation (not implemented)

Per the project brief, ads and analytics are deliberately **off** in this delivery — no
dummy ad unit IDs, no ad requests, no consent banner (a fake one would be worse than none).
Before pursuing AdSense:

1. Read Google's current official publisher documentation yourself at the time you apply —
   requirements and review criteria change, and nothing here should be treated as a substitute
   for that.
2. You will need to independently verify domain ownership (via whatever method Google's
   current flow requires) — that's unrelated to, and not satisfied by, the
   `PUBLIC_SITE_ORIGIN` validation this project does (which only checks the URL's *shape*,
   never ownership, DNS, or HTTPS availability).
3. You will need a real privacy policy disclosing ad personalization/data use, and — for EEA/
   UK visitors — a real consent-management flow (Google requires a Google-certified CMP for
   ad personalization consent under its EU user consent policy as of this writing; verify the
   current requirement yourself). None of that exists yet in this codebase.
4. When you do add ad slots, keep them out of: search, the clocks, the globe, search results,
   and all other interactive controls — and off error/unfinished screens entirely, per the
   brief. Nothing in this codebase currently reserves ad space, so you'll be adding it fresh;
   plan the layout so an ad slot doesn't shift the globe or clock controls when it loads.
5. None of the following are evidence of approval-readiness, and shouldn't be treated as such
   when you apply: having a 3D globe, using this particular tech stack, the number of pages,
   or the amount of written content. Google's actual review criteria are what they are at the
   time you apply.
