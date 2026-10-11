# Contributing

Thanks for helping improve E-Studenti. Keep changes small, reviewable and safe
for a public repository.

## Set up

Follow "Run it locally" in the [README](README.md). It needs Node 20+ and no
accounts. Before opening a pull request run:

```bash
npm run check     # lint + typecheck + tests (what CI runs)
npm run build     # for changes to the website; use `npm run stub-api` if offline
```

## Where things go

| Change | Where |
|---|---|
| A page or component | `app/` (keep it compatible with `output: "export"`: no API routes, no server-only code) |
| Anything the site **and** the Worker must agree on (faculties, types, limits, slugs, email rules) | `shared/` — then both sides pick it up |
| A new API action | `cloudflare-worker/src/index.js`: add a handler, add it to `accountActions` (needs sign-in) or `publicActions`, add the `case` in the router, add a test |
| A database change | a **new** file in `cloudflare-worker/migrations/` (next number, never edit an applied one) **and** the same change in `schema.sql` |
| A user-visible string | Albanian, in the component; keep the existing tone |

## Rules that protect users

- Never commit `.env`, `.dev.vars`, `.wrangler`, tokens, database dumps or admin tooling.
- Do not weaken authentication, upload validation, the review queue or the browser
  hardening in `public/_headers` without a reviewed replacement.
- Anything that renders text from an uploaded file must treat it as untrusted (see
  `app/lib/file-preview.js`). Links found inside documents are filtered; do not add
  `dangerouslySetInnerHTML` with unfiltered content.
- Anonymous uploads must not reveal the uploader: no user id in public URLs or
  payloads (`material-privacy.js` strips fields; extend it if you add one).
- Report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md).

## Style

- JavaScript with JSDoc types where it clarifies a contract. `npm run typecheck`
  covers `app/lib`, `shared` and the Worker; new modules there should typecheck.
- Prefer the existing Tailwind tokens (see `tailwind.config.js` and
  [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)). Text colours must meet 4.5:1
  contrast; use `text-gray-500` or darker, and the `*-text` status colours.
- Put browser-only APIs (`localStorage`, `window`) inside effects or event handlers.
- Comment the *why*, not the *what*. A short comment on a non-obvious decision
  beats a long one on obvious code.
- Disable a lint rule only on the line, with the reason after `--`.

## Tests

Tests live in `cloudflare-worker/src/*.test.js` and run with Vitest
(`npm test`). They cover the Worker, the logic in `shared/`, and the pure
browser-side modules (`app/lib/bulk-upload.js`). A bug fix should come with a test
that fails without it.

## Pull requests

- One logical change per PR. Say what changed, why, and how you tested it.
- Update the documentation when you change setup, deployment, security or
  configuration. Note any migration and the order to deploy in.
- CI must pass: lint, typecheck, tests, a Worker bundle check and a production build.
