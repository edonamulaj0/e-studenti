# Contributing

Thanks for helping improve E-Studenti. Keep contributions small, reviewable, and safe for a public repository.

## Local Setup

```bash
npm install
npm run dev
```

For Worker development:

```bash
cd cloudflare-worker
npm install
wrangler d1 execute srh-db --file=schema.sql
```

Use `.env.example` and `cloudflare-worker/.env.example` as templates. Do not put real credentials in committed files.

## Security Rules

- Do not commit `.env`, `.dev.vars`, `.wrangler`, `.next`, API tokens, secrets, database dumps, or private admin tooling.
- Do not add workflows or scripts that publish secrets, local state, or generated build output.
- Report vulnerabilities privately using the process in `SECURITY.md`.
- Do not weaken auth, upload validation, or browser hardening without a reviewed replacement.

## Pull Requests

- Open one logical change per PR.
- Explain what changed, why, and how you tested it.
- Update documentation when changing setup, deployment, security, or environment variables.
- Run `npm run build` before submitting frontend changes.
- For Worker changes, run the Worker checks available in `cloudflare-worker/` and test auth/upload/contact flows against a non-production environment.

## Code Style

- Keep the frontend compatible with `output: "export"`.
- Put browser-only APIs such as `localStorage` inside `useEffect` or event handlers.
- Keep public UI text in Albanian.
- Prefer existing Tailwind design tokens and local helpers over new one-off patterns.
