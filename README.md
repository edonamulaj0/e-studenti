# E-Studenti

**E-Studenti**, a community-built resource site for students of the University of Prishtina. The frontend is a Next.js 14 static export on Cloudflare Pages; all dynamic features run through the Cloudflare Worker in `cloudflare-worker/`.

## Features

- **Passwordless accounts**: register and verify with an email code.
- **User-managed uploads**: authenticated users upload materials and edit their own metadata from the web.
- **Live D1 catalog**: materials are queried from Cloudflare D1.
- **R2 file storage**: validated files are stored in Cloudflare R2 and served from the media domain.
- **Private contact form**: messages reach the owner through Resend without exposing an email address in the form.
- **Auto contributors**: contributors are generated from D1 based on uploaded materials.

## Tech Stack

- **Frontend**: Next.js 14 static export
- **Styling**: Tailwind CSS
- **Storage**: Cloudflare R2
- **Database**: Cloudflare D1 (`srh-db`)
- **Worker email**: Resend API
- **ZIP scanning**: central-directory and local-header walk in the worker (no decompression)

## Worker Setup

From `cloudflare-worker/`:

```bash
wrangler d1 create srh-db
wrangler d1 execute srh-db --file=schema.sql
wrangler d1 execute srh-db --file=seed.sql
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put ADMIN_EMAIL
npm run deploy
```

Set secrets via Wrangler only. Configure `ALLOWED_ORIGINS` (and related JWT settings) if your production domain differs from the defaults. The API defaults to `https://api.e-studenti.com`; override with `NEXT_PUBLIC_WORKER_URL` for local/dev.

## Resend Setup

1. Create an account at [resend.com](https://resend.com).
2. Add and verify a sending domain, or use `onboarding@resend.dev` for development.
3. Create an API key.
4. Run `wrangler secret put RESEND_API_KEY`.

## Project Structure

```text
e-studenti/
├── app/                         # Next.js static export app
│   ├── llogaria/                # Auth, upload, and user material pages
│   ├── materialet/              # Live D1-backed materials page
│   └── components/              # Shared UI
├── cloudflare-worker/
│   ├── src/index.js             # Worker API
│   ├── schema.sql               # D1 schema
│   ├── seed.sql                 # One-time legacy material seed
│   └── wrangler.toml            # Worker config
└── README.md
```

## Notes

- Never commit `.env`, `.dev.vars`, `.wrangler`, `.next`, or API secrets. Use the `.env.example` files as templates only.
- Keep `output: "export"` in `next.config.js`.
- Do not add Next.js route handlers or server-only frontend features.
- All dynamic requests go to `https://api.e-studenti.com` (or `NEXT_PUBLIC_WORKER_URL` when set).
- See `SECURITY.md` for how to report vulnerabilities.
