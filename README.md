# E-Studenti

A community library of study materials for students of universities and
colleges in Kosovo, plus a directory of their accredited programmes: lecture
notes, exam papers, projects and useful links, uploaded and reviewed by the
students themselves. The site is in Albanian and English and is not an
official university service.

## How it fits together

```text
 browser ── e-studenti.com ──────────► Cloudflare Pages   static Next.js export (no server code)
    │
    └────── api.e-studenti.com ──────► Cloudflare Worker   every dynamic feature
                                          ├─ D1   accounts, catalogue, reviews, statistics
                                          ├─ R2   the uploaded files (served from media.e-studenti.com)
                                          └─ Resend   sign-in codes and notifications by email
```

- **Website** (`app/`): Next.js 16, React 19, Tailwind CSS 4, plain JavaScript. It is
  built as a static export (`output: "export"`), so it cannot contain API routes
  or server-only code. Everything dynamic is a call to the Worker.
- **Worker** (`cloudflare-worker/`): one entry point (`src/index.js`) that routes
  `?action=<name>` requests. Sign-in is passwordless: an emailed code, then an
  `HttpOnly` cookie.
- **Shared code** (`shared/`): the rules both sides must agree on — faculties,
  material types, upload limits, URL slugs, disposable-email list. Change them
  there, once.
- **Accounts and moderation:** anyone can browse. Uploading needs an account;
  uploads from new users wait for a moderator, and there is exactly one moderator
  (see `docs/DEPLOYMENT.md`).

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Run it locally

You need Node 20 or newer (`.nvmrc` pins 22) and nothing else — no Cloudflare or
Resend account.

```bash
npm ci
npm ci --prefix cloudflare-worker
```

**Just the website** (fastest): serve a fake API and point the site at it.

```bash
npm run stub-api                                   # terminal 1, port 8799
NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8799 npm run dev     # terminal 2
```

**The whole thing**, with a real local database:

```bash
cp cloudflare-worker/.dev.vars.example cloudflare-worker/.dev.vars
npm run db:local                                   # creates the local database
npm run dev:worker                                 # terminal 1, http://127.0.0.1:8787
NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8787 npm run dev     # terminal 2, http://localhost:3000
```

Sign-in codes are printed in the Worker's terminal (`[dev email] …`) instead of
being emailed. Open <http://localhost:3000>, register, and copy the eight digits
from that terminal. To try moderation locally, register as `edonaamulaj@gmail.com`
(the moderator address is fixed in `cloudflare-worker/src/moderators.js`).

Safari does not store `Secure` cookies on `http://localhost`; use Chrome or Firefox.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Website dev server (port 3000) |
| `npm run db:local` | Creates/updates the local database from `cloudflare-worker/migrations` |
| `npm run dev:worker` | Worker with a local database (port 8787) |
| `npm run stub-api` | Fake read-only API for building the site offline |
| `npm run lint` | ESLint (Next.js rules) |
| `npm run typecheck` | Type-checks the JSDoc-annotated modules and the Worker |
| `npm test` | The Worker's test suite (Vitest), including shared and browser-side logic |
| `npm run check` | Lint, typecheck and tests — what CI runs |
| `npm run build` | Sitemap, static export into `out/`, then a scan for leaked secrets |
| `npm run test:e2e` | Browser smoke tests against a build served by `scripts/serve-static.mjs` (see `tests/e2e/smoke.test.mjs`) |

`npm run build` reads the catalogue from the API (`NEXT_PUBLIC_WORKER_URL`,
default production) to create one page per material. It stops with an error if
the API cannot be read, so a broken deploy never replaces a working site. To
build with no network, use the stub as above.

## Project layout

```text
app/                 website pages and components (Next.js app router)
  components/        shared UI (modals, cards, preview viewers)
  lib/               browser-side helpers; thin wrappers over shared/
  llogaria/          account pages: sign in, upload, my materials, moderation
  materialet/        catalogue and per-material pages
cloudflare-worker/
  src/index.js       the API: auth, upload, catalogue, moderation, accounts
  src/*.test.js      Worker and shared-logic tests
  migrations/        D1 schema history (apply in order)
  schema.sql         the same schema in one file, for a brand-new database
shared/              rules used by both the site and the Worker
scripts/             build helpers (sitemap, secret scan, stub API, Erasmus sync)
docs/                architecture, deployment, accessibility conventions
public/              static files, including `_headers` (CSP) and `_redirects`
```

## Configuration

| Where | Name | Purpose |
|---|---|---|
| site, build time | `NEXT_PUBLIC_WORKER_URL` | API origin (default `https://api.e-studenti.com`) |
| Worker secret | `JWT_SECRET` | signs session cookies; required |
| Worker secret | `RESEND_API_KEY` | sends email; without it, production sign-in fails closed |
| Worker secret | `ADMIN_EMAIL` | optional copy of contact-form messages |
| Worker secret | `PAGES_DEPLOY_HOOK` | optional; rebuilds the site when the catalogue changes |
| Worker secret | `GOOGLE_SAFE_BROWSING_API_KEY` | optional link checking |
| Worker `[vars]` | `ENVIRONMENT` | `production` in `wrangler.toml`; `development` locally via `.dev.vars` |

Never commit real credentials. Production secrets are set with
`wrangler secret put <NAME>`; see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for
the full procedure, migration order and operational notes.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). Report vulnerabilities privately, as
described in [`SECURITY.md`](SECURITY.md). Accessibility rules are in
[`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md).

## Troubleshooting

- **`npm ci` fails fetching `xlsx`.** The spreadsheet previewer uses SheetJS, which
  is published on `cdn.sheetjs.com` rather than npm. A proxy or firewall that
  blocks that host breaks the install; allow it, or install from a network that can.
- **`npm run build` says the API cannot be read.** Check `NEXT_PUBLIC_WORKER_URL`, or
  use `npm run stub-api`.
- **Sign-in says the email could not be sent (locally).** `ENVIRONMENT` is still
  `production`; copy `.dev.vars.example` to `.dev.vars`.
