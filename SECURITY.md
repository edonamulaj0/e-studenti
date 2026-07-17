# Security Policy

## Reporting A Vulnerability

Please do not open public issues for suspected vulnerabilities. Use GitHub private vulnerability reporting if it is enabled for the repository, or contact the maintainer privately before publishing details.

Include a short description, steps to reproduce (or a proof of concept), and impact. We aim to acknowledge reports within 72 hours and will coordinate disclosure after a fix is available.

## Secrets

Never commit `.env`, `.dev.vars`, Wrangler state, Cloudflare tokens, Resend keys, JWT secrets, or admin emails. Configure production secrets with `wrangler secret put`. Rotate any leaked credentials immediately.
