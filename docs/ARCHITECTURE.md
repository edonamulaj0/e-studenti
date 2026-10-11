# Architecture

## Request flow

1. The browser loads a static page from Cloudflare Pages (built by `next build`
   with `output: "export"`; headers come from `public/_headers`).
2. Dynamic features are `fetch` calls to the Worker at `api.e-studenti.com`,
   always `?action=<name>`. Cross-origin calls carry the session cookie
   (`SameSite=Lax`, `HttpOnly`, same site as the API) and an `Origin` that must be on
   the allow-list.
3. The Worker reads and writes D1 (SQL) and R2 (files). Uploaded files are served
   from `media.e-studenti.com`; the preview viewers fetch them through the
   Worker's `proxy` action so they are same-origin.

## Sign-in

Passwordless. `register`/`login` email a six-digit code (hashed in D1, 15-minute
life, 60-second resend gap, attempt limits per address and per email). `verify`
exchanges it for a signed cookie. `logout` bumps the user's `token_version`, which
invalidates every cookie they hold. Roles: anyone, signed-in user, and the single
moderator (`edonaamulaj@gmail.com`, fixed in `src/moderators.js`).

## Uploads and review

`upload` validates type, size, file signature (and ZIP structure), stores the file
in R2 under `materials/<uuid>/<name>`, and inserts a row. Users with fewer than 3
approved materials get `status = 'pending'`; the moderator approves or rejects in
the Moderim page and the user is emailed. Only `approved` rows appear in the
catalogue, statistics, slugs and view/download counts. The upload page
(`app/llogaria/ngarko`) batches up to 50 files, flags duplicates by SHA-256, and
retries safely using a per-file `client_upload_id`.

## The catalogue and the static site

Each material has a page generated at build time (`app/materialet/[slug]`). The
Worker computes slugs over the whole catalogue and returns them with every
listing. When the catalogue changes the Worker marks the site out of date and,
if `PAGES_DEPLOY_HOOK` is set, the hourly job asks Pages for a rebuild. Until the
rebuild, `/materialet/<new-slug>` falls to the 404 page, which loads the material
from the API (`app/lib/use-late-material.js`).

## Data model (D1)

`users` · `verification_codes` · `materials` (+ `status`, `content_hash`,
`client_upload_id`) · `reports` · `resource_links` (moderated external links) ·
`material_stat_events` (one row per visitor, material and day) · `site_stats`
(cached aggregates) · `rate_limits` · `contact_messages` · `rebuild_state`.
`migrations/` is the history; `schema.sql` is the same thing in one file.

## Privacy rules the code enforces

- Public payloads never include user ids, emails or storage keys
  (`material-privacy.js`); anonymous uploads show "Anonim" and are excluded from search by name.
- Account deletion keeps published items as "Anonim" and erases profile data.
- Visitor statistics store a salted hash of the address, not the address.

## Scheduled work

An hourly cron (`wrangler.toml`) refreshes statistics, deletes expired
rate-limit rows, codes and old statistic events, and — when configured — requests a
rebuild. A separate GitHub Action syncs Erasmus calls every two days.
