# Sync materials.json from R2 to local app/data/materials.json
#
# Usage: .\sync-materials.ps1

$WORKER_URL = "https://r2-catalog-manager.edonaamulaj.workers.dev?action=get"
$LOCAL_FILE = Join-Path $PSScriptRoot "app\data\materials.json"

Write-Host "Syncing materials.json from R2..." -ForegroundColor Cyan

try {
    # Fetch raw JSON data from R2 (not parsed by PowerShell)
    $response = Invoke-WebRequest -Uri $WORKER_URL -Method Get -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        # Parse to verify it's valid JSON and extract entries
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.entries) {
            # Convert entries back to JSON with standard formatting
            $jsonContent = $data.entries | ConvertTo-Json -Depth 10 -Compress:$false
            
            # Write to local file with UTF8 (no BOM)
            [System.IO.File]::WriteAllText($LOCAL_FILE, $jsonContent, [System.Text.UTF8Encoding]::new($false))
            
            Write-Host "Successfully synced $($data.entries.Count) entries to $LOCAL_FILE" -ForegroundColor Green
            Write-Host "Local materials.json updated!" -ForegroundColor Green
        } else {
            Write-Host "Invalid response format from R2" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "HTTP Error: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
