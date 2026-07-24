# JobFill - Download pdf.js for local resume parsing
# Run: powershell -ExecutionPolicy Bypass -File download_pdfjs.ps1

$version   = "3.11.174"
$baseUrl   = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/$version"
$outputDir = Join-Path $PSScriptRoot "libs"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created libs/ folder" -ForegroundColor DarkGray
}

$files = [ordered]@{
    "pdf.min.js"        = "$baseUrl/pdf.min.js"
    "pdf.worker.min.js" = "$baseUrl/pdf.worker.min.js"
}

foreach ($name in $files.Keys) {
    $outPath = Join-Path $outputDir $name
    Write-Host "Downloading $name ..." -ForegroundColor Cyan -NoNewline
    try {
        Invoke-WebRequest -Uri $files[$name] -OutFile $outPath -UseBasicParsing
        $kb = [Math]::Round((Get-Item $outPath).Length / 1KB)
        Write-Host "  OK  ($kb KB)" -ForegroundColor Green
    } catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "pdf.js is ready in ./libs/" -ForegroundColor Green
Write-Host "Reload the extension in chrome://extensions after this." -ForegroundColor Yellow
