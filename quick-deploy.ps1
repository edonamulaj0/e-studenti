# Quick Sync & Deploy Script
# Run this after saving changes in the admin UI
# Usage: .\quick-deploy.ps1

Write-Host "`n=== Materials Quick Deploy ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Sync from R2
Write-Host "Step 1: Syncing from R2..." -ForegroundColor Yellow
node sync-materials.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nSync failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Commit changes
Write-Host "`nStep 2: Committing changes..." -ForegroundColor Yellow
git add app/data/materials.json
git commit -m "Update materials from R2 - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nNothing to commit (no changes)" -ForegroundColor Gray
} else {
    # Step 3: Push to GitHub
    Write-Host "`nStep 3: Pushing to GitHub..." -ForegroundColor Yellow
    git push
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nPush failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "Changes synced and pushed to GitHub" -ForegroundColor Green
Write-Host "Your hosting platform will auto-deploy the updates" -ForegroundColor Green
Write-Host ""
