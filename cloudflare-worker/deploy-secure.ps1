# Secure Admin Panel Deployment Script
# Run this to deploy with password protection

Write-Host "🔐 Secure Admin Panel Deployment" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if in cloudflare-worker directory
if (-not (Test-Path "wrangler.toml")) {
    Write-Host "❌ Error: Please run this from the cloudflare-worker directory" -ForegroundColor Red
    Write-Host "Run: cd cloudflare-worker" -ForegroundColor Yellow
    exit 1
}

# Check if password is set
Write-Host "⚠️  IMPORTANT: Have you set the admin password?" -ForegroundColor Yellow
Write-Host ""
Write-Host "If NOT, run this command first:" -ForegroundColor Yellow
Write-Host "  wrangler secret put ADMIN_PASSWORD" -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Have you set the password? (y/n)"

if ($confirmation -ne 'y') {
    Write-Host ""
    Write-Host "Setting password now..." -ForegroundColor Cyan
    wrangler secret put ADMIN_PASSWORD
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to set password" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📦 Deploying worker..." -ForegroundColor Cyan
npm run deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔐 Admin Panel Security Status:" -ForegroundColor Cyan
    Write-Host "  ✓ Password protection: ENABLED" -ForegroundColor Green
    Write-Host "  ✓ HTTP Basic Auth: ACTIVE" -ForegroundColor Green
    Write-Host "  ✓ Protected actions: merge, delete, generate" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  KEEP YOUR PASSWORD PRIVATE!" -ForegroundColor Yellow
    Write-Host "   Do not share the admin URL publicly" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
