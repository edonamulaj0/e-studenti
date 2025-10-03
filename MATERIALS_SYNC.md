# Materials Sync Workflow

## Overview

This setup keeps your local `app/data/materials.json` in sync with the R2 bucket through the admin UI.

## Workflow

### 1. **Edit Materials via Admin UI**

- Open: https://admin-studenti.pages.dev
- Click "Load from R2" to see incomplete entries
- Fill in faculty, type, subject, teacher, etc.
- Click "Save to R2" when done

### 2. **Sync to Local File**

After saving changes in the admin UI, sync them to your local codebase:

**Option A: PowerShell (Windows)**

```powershell
.\sync-materials.ps1
```

**Option B: Node.js (Cross-platform)**

```bash
npm run sync
```

**Option C: Node script directly**

```bash
node sync-materials.js
```

### 3. **Verify Changes**

Check `app/data/materials.json` - it should now have the updated entries from R2.

### 4. **Deploy Website**

After syncing, rebuild and deploy your Next.js site:

```bash
npm run build
# Then deploy to your hosting platform (Vercel, Cloudflare Pages, etc.)
```

## Why This Workflow?

✅ **Static Site Performance** - Next.js builds static pages with materials.json
✅ **Easy Management** - Admin UI provides visual interface for editing
✅ **Single Source of Truth** - R2 bucket stores the canonical data
✅ **Simple Sync** - One command to update local file
✅ **Version Control** - Local file can be committed to git

## Files Involved

- `app/data/materials.json` - Local materials catalog (used by website)
- `sync-materials.ps1` - PowerShell sync script
- `sync-materials.js` - Node.js sync script
- Admin UI: https://admin-studenti.pages.dev
- Worker API: https://r2-catalog-manager.edonaamulaj.workers.dev

## Admin UI Features

- 👁️ **View Document** - Open files in new tab
- 🗑️ **Delete** - Remove files from R2 (with confirmation)
- 💾 **Save to R2** - Update materials catalog
- ⬇️ **Download JSON** - Download catalog as JSON file
- 🔍 **Filters** - Filter by file type (PDF, RAR, DOCX, etc.)

## Tips

1. **Always sync after editing** - Run `.\sync-materials.ps1` after saving changes in admin
2. **Commit changes** - Add the updated `materials.json` to git
3. **Rebuild website** - Deploy new version after syncing
4. **Backup** - The R2 bucket serves as your backup

## Automation (Optional)

You can add the sync command to your build process in `package.json`:

```json
{
  "scripts": {
    "prebuild": "npm run sync",
    "build": "next build"
  }
}
```

This will automatically sync from R2 before every build.
