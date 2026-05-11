# Security Policy

## Reporting A Vulnerability

Please do not open public issues for suspected vulnerabilities. Use GitHub private vulnerability reporting if it is enabled for the repository, or contact the maintainer privately before publishing details.

Include:

- A short description of the issue and affected area.
- Steps to reproduce or a proof of concept.
- Impact, including whether credentials, uploads, user accounts, or R2 objects are affected.
- Suggested remediation if you have one.

We aim to acknowledge reports within 72 hours and will coordinate disclosure after a fix is available.

## Secret Handling

- Never commit `.env`, `.dev.vars`, Wrangler state, Cloudflare tokens, Resend keys, JWT secrets, or admin emails.
- Use `wrangler secret put JWT_SECRET`, `wrangler secret put RESEND_API_KEY`, and `wrangler secret put ADMIN_EMAIL` for production.
- Rotate leaked Cloudflare API tokens immediately from the Cloudflare dashboard and replace them with least-privilege tokens.

## Current Security Model

- The frontend is a static Next.js export.
- Dynamic actions go through the Cloudflare Worker.
- JWT access tokens are short lived and include `iss`, `aud`, `iat`, and `exp` claims.
- Verification codes are hashed before storage.
- Upload and auth endpoints are rate limited.
- CORS is restricted to configured origins.
- ZIP uploads are checked for dangerous files and archive size limits.

## Known Hardening Backlog

The current static export stores access tokens in browser storage. A future backend-compatible architecture should migrate authentication to `HttpOnly; Secure; SameSite=Lax` cookies with refresh token rotation.
