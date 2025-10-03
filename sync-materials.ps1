# Sync materials.json from R2 to local app/data/materials.json
#
# Usage: .\sync-materials.ps1

$WORKER_URL = "https://r2-catalog-manager.edonaamulaj.workers.dev?action=get"
$LOCAL_FILE = Join-Path $PSScriptRoot "app\data\materials.json"

Write-Host "Syncing materials.json from R2..." -ForegroundColor Cyan

try {
    # Fetch data from R2
    $response = Invoke-RestMethod -Uri $WORKER_URL -Method Get
    
    if ($response.entries -and $response.entries.Count -ge 0) {
        # Convert to pretty-printed JSON
        $jsonContent = $response.entries | ConvertTo-Json -Depth 10
        
        # Write to local file
        $jsonContent | Set-Content -Path $LOCAL_FILE -Encoding UTF8
        
        Write-Host "Successfully synced $($response.entries.Count) entries to $LOCAL_FILE" -ForegroundColor Green
        Write-Host "Local materials.json updated!" -ForegroundColor Green
    } else {
        Write-Host "Invalid response format from R2" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
