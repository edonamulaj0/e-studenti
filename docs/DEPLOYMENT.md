# Deployment Checklist

## Before Publishing

- Rotate any Cloudflare API token that was ever stored in a local `.env`.
- Verify `.env`, `.dev.vars`, `.wrangler`, `.next`, and admin tooling are not tracked.
- Confirm `.env.example` files contain placeholders only.
- Run `git ls-files | rg '(^|/)(\\.next|\\.wrangler|\\.env|\\.dev\\.vars)(/|$)'` and investigate any output.

## Worker Setup

```bash
cd cloudflare-worker
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
npm run deploy
```

Use your real Resend API key when setting `RESEND_API_KEY`; do not paste
`re_xxxxxxxxx` into code or commit it. The Worker reads it from Cloudflare
secrets at runtime.

`ADMIN_EMAIL` is optional. If set, contact-form messages are also copied to
that inbox. Without it, contact-form messages are stored in D1 and the public
site tells users to use Instagram `@estudenti.hub` for replies.

Public materials render from R2 and do not need D1:

- `e-studenti-materials` stores the files.
- `materials-metadata` stores `materials.json` with file metadata.
- `department-materials` is reserved for programme data.

Account registration, login, email code verification, and user-owned uploads do
need a D1 database bound as `DB`. Create it once, apply only the schema, and do
not run `seed.sql` on production:

```bash
cd cloudflare-worker
wrangler d1 create e-studenti-auth
wrangler d1 execute e-studenti-auth --remote --file=./schema.sql
```

Then add the returned `database_id` to `cloudflare-worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "e-studenti-auth"
database_id = "paste-cloudflare-d1-id-here"
```

Optional non-secret Worker variables:

```bash
wrangler secret put JWT_ISSUER
wrangler secret put JWT_AUDIENCE
wrangler secret put ALLOWED_ORIGINS
```

`ALLOWED_ORIGINS` is a comma-separated list of frontend origins allowed to call the Worker.

## Frontend Setup

```bash
npm install
npm run build
```

Deploy the static export to Cloudflare Pages. The `public/_headers` file is used for CSP and browser hardening headers.

## Production Verification

```bash
curl -I https://your-domain.example
curl -I "https://r2-catalog-manager.example.workers.dev?action=materials&limit=3"
curl -I "https://r2-catalog-manager.example.workers.dev?action=contributors"
```

Check for:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- Restricted `Access-Control-Allow-Origin`
- Materials and contributors return `200`, not `401`
- Auth codes expire and cannot be reused
- JWTs expire after 15 minutes
- Register, login, verify, contact, and upload rate limits return `429` after repeated abuse
- ZIP upload limits reject dangerous or oversized archives
