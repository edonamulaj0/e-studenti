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
wrangler d1 migrations apply e-studenti-auth --remote   # applies 0011 to 0016
```

Existing materials are marked `approved`. The thresholds are
`TRUSTED_APPROVED_UPLOADS` and `MAX_PENDING_PER_USER` in `src/index.js`.
Files under review are not listed or counted, but their unguessable media URL is
reachable by anyone who has it; only the owner and moderators are given it.

## Reports and the 3-report email

A report counts once per person per file (signed-in users by account, others by a
salted hash of their IP; the IP itself is never stored). When a *published* file
reaches **3 distinct reporters** the moderator gets one email, and at most one
reminder digest per 24 hours while it stays flagged. The hourly cron retries a
failed send. The file is **not** hidden automatically (that would let three people
silence any file): **Moderim → Raportet** shows flagged files first, with
"Hiq nga publikimi", which returns the file to the review queue. Migration
`0015_report_alerts_and_trust.sql` must be applied **before** deploying this
Worker (it reads `reports.reporter_key` and `users.trust_revoked`). The moderator
can also withdraw an uploader's trusted status there; trusted uploaders show a
check mark on public cards (never on anonymous uploads).

## Universities

Every material belongs to a university (`materials.university`, migration `0016_material_university.sql`; existing rows default to the University of Prishtina). At UP the `faculty` column holds a faculty code; at every other institution it holds a study-field code (`FIELDS` in `shared/material-options.mjs`). The list of universities in `shared/universities.mjs` is generated by `scripts/build-directory-data.mjs` from the AKA accredited-programme list; rerun it when that list changes. Apply migration 0016 **before** deploying the Worker (uploads now insert `university`). Subject pages of other universities carry a tag in their slug (`algoritme-inf-ubt`); UP's slugs are unchanged. The Erasmus page is UP-only and says so.

## Subjects

`/lenda/<slug>` groups a subject's materials (cards and the catalogue sidebar link to it). A subject is identified
by its normalised name per faculty, so "Anatomi", "anatomi" and "ANATOMI" merge
automatically. Other spelling differences are merged in **Moderim → Lëndët**
(rename), which rewrites the stored subject on every affected material. New uploads
reuse an existing spelling. Subject pages are generated at build time; a subject
created later loads client-side until the next deploy.

## Moderator access

There is exactly one moderator: **edonaamulaj@gmail.com** (`MODERATOR_EMAIL` in
`cloudflare-worker/src/moderators.js`). Access follows the verified email on the
account alone; the `users.is_moderator` column and the old `MODERATOR_EMAILS`
secret are no longer consulted. Changing who moderates means changing that
constant. Migration `0012_single_moderator.sql` makes the column agree. You can
also delete the now-unused secret:

```bash
wrangler secret delete MODERATOR_EMAILS
```

## Accounts: export and deletion

Signed-in users can download their data and delete their account from
**Materiale të mia**.

- **Export** (JSON): profile, their materials (metadata and file URLs), their
  submitted links, and the reports they filed. No other users' data and no
  internal moderation or safety-scan fields.
- **Deletion:** name, surname and email are erased and the address can sign up
  again as a new account. Published materials and approved links remain, shown
  as "Anonim", and can no longer be edited or deleted by the former owner (the
  moderator can still remove them). Pending and rejected items, including their
  files, are deleted. The moderator account cannot be deleted this way.

## Contact messages

Messages from the contact form appear in **Moderim → Mesazhe** and can be
deleted there; they are stored in D1 whether or not `ADMIN_EMAIL` is set.

## Materials added after a build

Material pages are generated at build time, so the site has to be rebuilt for a
new upload to get its own static page (and a sitemap entry). Two things cover
this:

1. **Automatic rebuilds (recommended).** Whenever the public catalogue changes
   (an approved upload, an edit, a deletion, a moderator decision, an account
   deletion), the Worker marks the site as out of date. The hourly job then asks
   Cloudflare Pages for a new build, at most once every 2 hours, so a burst of
   changes costs one build. To enable it, create a **deploy hook** in the
   Cloudflare dashboard (Workers & Pages → your Pages project → Settings →
   Builds → Deploy hooks) and give its URL to the Worker:

   ```bash
   wrangler secret put PAGES_DEPLOY_HOOK
   ```

   This needs the Pages project to be connected to the Git repository (deploy
   hooks do not exist for direct uploads). Without the secret nothing is
   requested and everything else works as before. The URL must start with
   `https://api.cloudflare.com/`; anything else is ignored.

2. **Until that build finishes.** A material without a static page falls through
   to the 404 page, which shows a loading skeleton, fetches the material from the
   API and renders the normal detail view. The HTTP status of that response is
   404 (Cloudflare chooses it before any page code runs), so search engines see
   the page only after the rebuild above.

## Multi-file upload

`/llogaria/ngarko` takes up to 50 files at once. Each file becomes an editable
row (title and type are guessed from the file name; faculty, subject and the rest
are shared and can be overridden per file). While the user fills the form the
browser hashes each file (SHA-256) and asks `check-duplicates` whether it already
exists, so likely duplicates are flagged before anything is sent and skipped
unless the user opts in.

Uploads go out two at a time, never more than 64MB in flight (the Worker holds
each upload in memory), through the existing `upload` action, with per-file
progress, pause/resume, cancel and retry. Each file carries a `client_upload_id`;
if a response is lost and the file is retried, the Worker returns the row that
already exists instead of storing a second copy. When the pending-review limit
or a rate limit is hit, the queue pauses (rate limits resume by themselves) and
nothing is lost.

Migration `0014_add_upload_dedup.sql` adds `content_hash` and
`client_upload_id`. The hash is computed in the browser and is only a hint for
duplicate warnings, never used for security.

Not included: the queue does not survive a page reload (the browser asks before
leaving while uploads are active), and files still pass through the Worker
rather than going straight to R2.
