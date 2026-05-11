# E-Studenti

**E-Studenti**, a community-built resource site for students of the University of Prishtina. The frontend is a Next.js 14 static export on Cloudflare Pages; all dynamic features run through the Cloudflare Worker in `cloudflare-worker/`.

## Features

- **Passwordless accounts**: users register, verify email codes, and receive JWTs for authenticated actions.
- **User-managed uploads**: authenticated users upload materials and edit their own metadata from the web.
- **Live D1 catalog**: materials are queried from Cloudflare D1 instead of a static `materials.json` file.
- **R2 file storage**: validated files are stored in Cloudflare R2 and served from the media domain.
- **Private contact form**: messages are sent to the owner through Resend without exposing any email address in the form.
- **Auto contributors**: contributors are generated from D1 based on uploaded materials.
- **Security hardening**: short-lived JWTs, hashed verification codes, D1-backed rate limiting, restricted CORS, CSP headers, and ZIP upload limits.

## Tech Stack

- **Frontend**: Next.js 14 static export
- **Styling**: Tailwind CSS
- **Storage**: Cloudflare R2
- **Database**: Cloudflare D1 (`srh-db`)
- **Worker email**: Resend API
- **ZIP scanning**: `fflate`

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

`JWT_SECRET` should be a random 64-character string. `ADMIN_EMAIL` is only used by the Worker as the private recipient for contact-form messages and is never sent to the frontend. Configure `ALLOWED_ORIGINS`, `JWT_ISSUER`, and `JWT_AUDIENCE` if your production domain differs from the defaults.

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

## Security Notes

- Never commit `.env`, `.dev.vars`, `.wrangler`, `.next`, Cloudflare tokens, Resend keys, or JWT secrets.
- Use the placeholder values in `.env.example` and `cloudflare-worker/.env.example` as templates only.
- Rotate any Cloudflare API token that was ever present in a local `.env` before publishing.
- See `SECURITY.md` and `docs/DEPLOYMENT.md` before opening the repository publicly.

## Notes

- Keep `output: "export"` in `next.config.js`.
- Do not add Next.js route handlers or server-only frontend features.
- All dynamic requests go to `https://r2-catalog-manager.edonaamulaj.workers.dev`.
- Auth tokens are short-lived JWTs stored in `localStorage` by client-only code after login or verification. A future backend-compatible auth flow should move tokens to `HttpOnly` cookies with refresh token rotation.
