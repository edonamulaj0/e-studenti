# Auto-Deploy Setup Guide

## ✨ Simple 2-Step Workflow

### Step 1: Edit in Admin UI

1. Open: **https://admin-studenti.pages.dev**
2. Click **"Load from R2"**
3. Edit materials (fill in faculty, type, subject, etc.)
4. Click **"💾 Save to R2"**

### Step 2: Deploy with One Command

```bash
npm run sync
```

**That's it!** This single command will:

- ✅ Download from R2
- ✅ Save to local `app/data/materials.json`
- ✅ Commit to git
- ✅ Push to GitHub
- ✅ Auto-deploy your website (via Vercel/Cloudflare auto-deploy)

---

## What Happens Behind the Scenes

When you run `npm run sync`:

1. Downloads latest materials.json from R2
2. Saves to `app/data/materials.json`
3. Commits the changes
4. Pushes to GitHub
5. GitHub Actions runs (validates build)
6. Your hosting platform (Vercel/Cloudflare) auto-deploys
7. Website updates with new materials!

---

## Alternative: Advanced Auto-Deploy (Optional)

If you want **zero terminal commands**, you can use the webhook server:

### Setup (One-time):

```bash
npm run webhook
```

### Usage:

Click **"🚀 Save & Deploy"** in admin UI

But honestly, `npm run sync` is simpler! 😊

---

## Files

- `sync-materials.js` - Downloads and syncs materials.json
- `package.json` - Contains the `npm run sync` command
- `.github/workflows/deploy-materials.yml` - GitHub Actions for validation
- Admin UI: https://admin-studenti.pages.dev
