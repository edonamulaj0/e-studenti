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

Public materials are listed from D1 with SQL pagination. File bytes live in R2
(`e-studenti-materials` → `media.e-studenti.com`). The `materials-metadata`
bucket is legacy-only (orphan rows not yet imported into D1) and is not scanned
on every catalog request.

- `e-studenti-materials` stores the uploaded files.
- `materials-metadata` is optional legacy metadata (orphans for slug lookup).
- `department-materials` is reserved for programme data.

Account registration, login, email code verification, and user-owned uploads
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
curl -I https://e-studenti.com
curl -I "https://api.e-studenti.com?action=materials&limit=3"
curl -I "https://api.e-studenti.com?action=contributors"
```

Confirm the site and Worker respond as expected, public catalog endpoints are reachable, and auth/upload flows work end to end after deploy.
## One-off: remove user ids from existing file URLs

Files uploaded before opaque keys live under `materials/<numeric user id>/…`, so
their public URLs identify the uploader (and link "anonymous" uploads to the same
person's named ones). New uploads no longer do this. To migrate the old ones,
deploy the Worker, sign in on `https://e-studenti.com` as a moderator, and run
this in the browser console. It is resumable and safe to re-run:

```js
let after_id = 0, done = false;
while (!done) {
  const r = await fetch("https://api.e-studenti.com/?action=rekey-materials", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ after_id }),
  }).then((res) => res.json());
  console.log(r);
  ({ next_after_id: after_id, done } = r);
}
```

Each file is copied to `materials/<uuid>/…`, its row is repointed, and the
original object is deleted, so old URLs stop working (bookmarks, search-engine
results, shared links). Anything listed under `skipped` was not changed.

## Upload review queue

Uploads from users with fewer than 3 approved materials are saved as `pending`
and stay hidden until a moderator approves them (**Moderim → Në pritje**).
Moderators and trusted users publish immediately. A user can have at most 10
items waiting. Rejected items stay visible to their owner with the reason, and
editing one resubmits it. The uploader is emailed on approval or rejection.

The Worker reads the new `materials.status` column everywhere, so **apply the
migration before deploying the Worker**, or every catalogue query will fail:

```bash
cd cloudflare-worker
wrangler d1 migrations apply e-studenti-auth --remote
```

Existing materials are marked `approved`. The thresholds are
`TRUSTED_APPROVED_UPLOADS` and `MAX_PENDING_PER_USER` in `src/index.js`.
Files under review are not listed or counted, but their unguessable media URL is
reachable by anyone who has it; only the owner and moderators are given it.
