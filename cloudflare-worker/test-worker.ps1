# Quick Test Script for R2 Catalog Manager
# Run this after deployment to verify everything works

param(
	[Parameter(Mandatory = $true)]
	[string]$WorkerUrl
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
	param([string]$Message, [string]$Color = "White")
	Write-Host $Message -ForegroundColor $Color
}

function Test-Endpoint {
	param(
		[string]$Name,
		[string]$Url,
		[string]$Method = "GET",
		[object]$Body = $null
	)
    
	Write-ColorOutput "`n  Testing $Name..." "Gray"
    
	try {
		$params = @{
			Uri        = $Url
			Method     = $Method
			TimeoutSec = 10
		}
        
		if ($Body) {
			$params.Body = ($Body | ConvertTo-Json)
			$params.ContentType = "application/json"
		}
        
		$response = Invoke-RestMethod @params
		Write-ColorOutput "  ✓ $Name - OK" "Green"
		return $response
	}
 catch {
		Write-ColorOutput "  ✗ $Name - FAILED: $_" "Red"
		return $null
	}
}

Write-ColorOutput "`n╔════════════════════════════════════════════════════╗" "Cyan"
Write-ColorOutput "║   R2 Catalog Manager - Quick Test                  ║" "Cyan"
Write-ColorOutput "╚════════════════════════════════════════════════════╝" "Cyan"

Write-ColorOutput "`nTesting Worker: $WorkerUrl" "Cyan"

# Test 1: GET endpoint
$getResponse = Test-Endpoint -Name "GET /materials" -Url "$WorkerUrl?action=get"
if ($getResponse) {
	$count = $getResponse.entries.Count
	Write-ColorOutput "    → Found $count entries in catalog" "Gray"
}

# Test 2: GENERATE endpoint
$generateResponse = Test-Endpoint -Name "GENERATE catalog" -Url "$WorkerUrl?action=generate"
if ($generateResponse) {
	Write-ColorOutput "    → Total: $($generateResponse.total)" "Gray"
	Write-ColorOutput "    → New: $($generateResponse.new)" "Gray"
	Write-ColorOutput "    → Existing: $($generateResponse.existing)" "Gray"
}

# Test 3: CORS preflight
Write-ColorOutput "`n  Testing CORS..." "Gray"
try {
	$response = Invoke-WebRequest -Uri "$WorkerUrl?action=get" -Method Options -TimeoutSec 10
	$corsHeader = $response.Headers.'Access-Control-Allow-Origin'
	if ($corsHeader) {
		Write-ColorOutput "  ✓ CORS - OK (Origin: $corsHeader)" "Green"
	}
 else {
		Write-ColorOutput "  ✗ CORS - No headers found" "Red"
	}
}
catch {
	Write-ColorOutput "  ⚠ CORS - Test inconclusive" "Yellow"
}

# Test 4: Error handling
Write-ColorOutput "`n  Testing error handling..." "Gray"
try {
	$response = Invoke-RestMethod -Uri "$WorkerUrl?action=invalid" -TimeoutSec 10
	Write-ColorOutput "  ✗ Error handling - Should return error" "Red"
}
catch {
	Write-ColorOutput "  ✓ Error handling - OK (Returns error correctly)" "Green"
}

# Test 5: Response time
Write-ColorOutput "`n  Testing response time..." "Gray"
$time = Measure-Command {
	Invoke-RestMethod -Uri "$WorkerUrl?action=get" -TimeoutSec 10 | Out-Null
}
$ms = [math]::Round($time.TotalMilliseconds, 2)
if ($ms -lt 500) {
	Write-ColorOutput "  ✓ Response time - OK ($ms ms)" "Green"
}
else {
	Write-ColorOutput "  ⚠ Response time - Slow ($ms ms)" "Yellow"
}

# Summary
Write-ColorOutput "`n╔════════════════════════════════════════════════════╗" "Cyan"
Write-ColorOutput "║   Test Results                                      ║" "Cyan"
Write-ColorOutput "╚════════════════════════════════════════════════════╝" "Cyan"

if ($getResponse -and $generateResponse) {
	Write-ColorOutput "`n✅ All critical tests passed!" "Green"
	Write-ColorOutput "`nYour worker is ready to use!" "Cyan"
	Write-ColorOutput "`nNext steps:" "Yellow"
	Write-ColorOutput "  1. Update admin/index.html with this worker URL" "White"
	Write-ColorOutput "  2. Deploy admin UI to Cloudflare Pages" "White"
	Write-ColorOutput "  3. Open admin panel and click 'Load from R2'" "White"
	Write-ColorOutput "  4. Fill metadata and save" "White"
}
else {
	Write-ColorOutput "`n⚠ Some tests failed. Check the errors above." "Yellow"
	Write-ColorOutput "`nCommon issues:" "Yellow"
	Write-ColorOutput "  • R2 bucket not bound correctly in wrangler.toml" "White"
	Write-ColorOutput "  • Bucket name mismatch" "White"
	Write-ColorOutput "  • Worker not fully deployed yet" "White"
}

Write-ColorOutput "`n📚 For more detailed testing, see TESTING_GUIDE.md" "Cyan"
