# R2 Catalog Manager - Automated Deployment Script
# This script helps you deploy the worker and verify the setup

param(
	[Parameter(Mandatory = $false)]
	[string]$BucketName,
    
	[Parameter(Mandatory = $false)]
	[switch]$SkipTests,
    
	[Parameter(Mandatory = $false)]
	[switch]$Help
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
	param([string]$Message, [string]$Color = "White")
	Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
	Write-ColorOutput "`n=== R2 Catalog Manager - Deployment Script ===" "Cyan"
	Write-ColorOutput "`nUsage:" "Yellow"
	Write-ColorOutput "  .\deploy.ps1 [-BucketName <name>] [-SkipTests] [-Help]"
	Write-ColorOutput "`nParameters:" "Yellow"
	Write-ColorOutput "  -BucketName   : Your R2 bucket name (will prompt if not provided)"
	Write-ColorOutput "  -SkipTests    : Skip post-deployment tests"
	Write-ColorOutput "  -Help         : Show this help message"
	Write-ColorOutput "`nExample:" "Yellow"
	Write-ColorOutput "  .\deploy.ps1 -BucketName my-bucket" "Green"
	exit 0
}

function Test-Prerequisites {
	Write-ColorOutput "`n[1/7] Checking prerequisites..." "Yellow"
    
	# Check Node.js
	try {
		$nodeVersion = node --version
		Write-ColorOutput "  ✓ Node.js installed: $nodeVersion" "Green"
	}
 catch {
		Write-ColorOutput "  ✗ Node.js not found. Please install Node.js 16+" "Red"
		exit 1
	}
    
	# Check npm
	try {
		$npmVersion = npm --version
		Write-ColorOutput "  ✓ npm installed: $npmVersion" "Green"
	}
 catch {
		Write-ColorOutput "  ✗ npm not found" "Red"
		exit 1
	}
    
	# Check Wrangler
	try {
		$wranglerVersion = wrangler --version
		Write-ColorOutput "  ✓ Wrangler installed: $wranglerVersion" "Green"
	}
 catch {
		Write-ColorOutput "  ✗ Wrangler not found. Installing..." "Yellow"
		npm install -g wrangler
		Write-ColorOutput "  ✓ Wrangler installed" "Green"
	}
}

function Install-Dependencies {
	Write-ColorOutput "`n[2/7] Installing dependencies..." "Yellow"
    
	if (Test-Path "package.json") {
		npm install
		Write-ColorOutput "  ✓ Dependencies installed" "Green"
	}
 else {
		Write-ColorOutput "  ✗ package.json not found. Are you in the right directory?" "Red"
		exit 1
	}
}

function Update-Configuration {
	param([string]$Bucket)
    
	Write-ColorOutput "`n[3/7] Updating configuration..." "Yellow"
    
	if (-not $Bucket) {
		$Bucket = Read-Host "  Enter your R2 bucket name"
	}
    
	# Update wrangler.toml
	$wranglerPath = "wrangler.toml"
	if (Test-Path $wranglerPath) {
		$content = Get-Content $wranglerPath -Raw
		$content = $content -replace 'bucket_name = ".*"', "bucket_name = `"$Bucket`""
		Set-Content $wranglerPath $content
		Write-ColorOutput "  ✓ Updated wrangler.toml with bucket: $Bucket" "Green"
	}
 else {
		Write-ColorOutput "  ✗ wrangler.toml not found" "Red"
		exit 1
	}
}

function Login-Cloudflare {
	Write-ColorOutput "`n[4/7] Logging in to Cloudflare..." "Yellow"
    
	try {
		$whoami = wrangler whoami 2>&1
		if ($whoami -match "You are logged in") {
			Write-ColorOutput "  ✓ Already logged in to Cloudflare" "Green"
		}
		else {
			throw "Not logged in"
		}
	}
 catch {
		Write-ColorOutput "  Opening browser for authentication..." "Yellow"
		wrangler login
		Write-ColorOutput "  ✓ Logged in to Cloudflare" "Green"
	}
}

function Deploy-Worker {
	Write-ColorOutput "`n[5/7] Deploying worker..." "Yellow"
    
	try {
		$output = wrangler deploy 2>&1
		Write-ColorOutput "$output" "Gray"
        
		# Extract worker URL from output
		$workerUrl = $output | Select-String -Pattern "https://.*\.workers\.dev" | ForEach-Object { $_.Matches.Value } | Select-Object -First 1
        
		if ($workerUrl) {
			Write-ColorOutput "`n  ✓ Worker deployed successfully!" "Green"
			Write-ColorOutput "  📍 Worker URL: $workerUrl" "Cyan"
			return $workerUrl
		}
		else {
			Write-ColorOutput "  ⚠ Worker deployed but URL not found in output" "Yellow"
			return $null
		}
	}
 catch {
		Write-ColorOutput "  ✗ Deployment failed: $_" "Red"
		exit 1
	}
}

function Show-NextSteps {
	param([string]$WorkerUrl)
    
	Write-ColorOutput "`n[6/7] Next steps..." "Yellow"
    
	Write-ColorOutput "`n📋 IMPORTANT: Update your admin UI!" "Cyan"
	Write-ColorOutput "  1. Edit: admin\index.html" "White"
	Write-ColorOutput "  2. Find line ~300: const WORKER_URL = '...'" "White"
	Write-ColorOutput "  3. Replace with: const WORKER_URL = '$WorkerUrl'" "Green"
	Write-ColorOutput "  4. Deploy admin UI to Cloudflare Pages" "White"
    
	Write-ColorOutput "`n📱 Deploy Admin UI to Cloudflare Pages:" "Cyan"
	Write-ColorOutput "  1. Go to: https://dash.cloudflare.com/?to=/:account/pages" "White"
	Write-ColorOutput "  2. Click 'Create a project' → 'Upload assets'" "White"
	Write-ColorOutput "  3. Upload: admin\index.html" "White"
	Write-ColorOutput "  4. Click 'Save and Deploy'" "White"
    
	Write-ColorOutput "`n🌐 Integrate with your website:" "Cyan"
	Write-ColorOutput "  See: WEBSITE_INTEGRATION.md for examples" "White"
}

function Test-Deployment {
	param([string]$WorkerUrl)
    
	Write-ColorOutput "`n[7/7] Testing deployment..." "Yellow"
    
	if (-not $WorkerUrl) {
		Write-ColorOutput "  ⚠ Worker URL not available, skipping tests" "Yellow"
		return
	}
    
	# Test GET endpoint
	Write-ColorOutput "  Testing GET endpoint..." "Gray"
	try {
		$response = Invoke-RestMethod -Uri "$WorkerUrl?action=get" -TimeoutSec 10
		Write-ColorOutput "  ✓ GET endpoint working" "Green"
	}
 catch {
		Write-ColorOutput "  ✗ GET endpoint failed: $_" "Red"
	}
    
	# Test GENERATE endpoint
	Write-ColorOutput "  Testing GENERATE endpoint..." "Gray"
	try {
		$response = Invoke-RestMethod -Uri "$WorkerUrl?action=generate" -TimeoutSec 10
		if ($response.success) {
			Write-ColorOutput "  ✓ GENERATE endpoint working (Found $($response.total) files)" "Green"
		}
		else {
			Write-ColorOutput "  ✗ GENERATE endpoint returned error" "Red"
		}
	}
 catch {
		Write-ColorOutput "  ✗ GENERATE endpoint failed: $_" "Red"
	}
    
	# Test CORS
	Write-ColorOutput "  Testing CORS..." "Gray"
	try {
		$response = Invoke-WebRequest -Uri "$WorkerUrl?action=get" -Method Options -TimeoutSec 10
		if ($response.Headers.'Access-Control-Allow-Origin') {
			Write-ColorOutput "  ✓ CORS headers configured" "Green"
		}
		else {
			Write-ColorOutput "  ✗ CORS headers missing" "Red"
		}
	}
 catch {
		Write-ColorOutput "  ⚠ CORS test inconclusive" "Yellow"
	}
}

# Main execution
if ($Help) {
	Show-Help
}

Write-ColorOutput "`n╔════════════════════════════════════════════════════╗" "Cyan"
Write-ColorOutput "║   R2 Catalog Manager - Deployment Script          ║" "Cyan"
Write-ColorOutput "╚════════════════════════════════════════════════════╝" "Cyan"

try {
	Test-Prerequisites
	Install-Dependencies
	Update-Configuration -Bucket $BucketName
	Login-Cloudflare
	$workerUrl = Deploy-Worker
    
	if (-not $SkipTests) {
		Test-Deployment -WorkerUrl $workerUrl
	}
    
	Show-NextSteps -WorkerUrl $workerUrl
    
	Write-ColorOutput "`n╔════════════════════════════════════════════════════╗" "Green"
	Write-ColorOutput "║   ✅ Deployment Complete!                          ║" "Green"
	Write-ColorOutput "╚════════════════════════════════════════════════════╝" "Green"
    
	Write-ColorOutput "`n📚 Documentation:" "Cyan"
	Write-ColorOutput "  • Quick Start: QUICKSTART.md" "White"
	Write-ColorOutput "  • Full Guide: DEPLOYMENT_GUIDE.md" "White"
	Write-ColorOutput "  • Testing: TESTING_GUIDE.md" "White"
	Write-ColorOutput "  • Integration: WEBSITE_INTEGRATION.md" "White"
    
	if ($workerUrl) {
		Write-ColorOutput "`n🔗 Your Worker URL:" "Cyan"
		Write-ColorOutput "  $workerUrl" "Green"
		Write-ColorOutput "`n💡 Save this URL - you'll need it for the admin UI!" "Yellow"
	}
    
}
catch {
	Write-ColorOutput "`n✗ Deployment failed: $_" "Red"
	Write-ColorOutput "Please check the error and try again." "Yellow"
	exit 1
}
