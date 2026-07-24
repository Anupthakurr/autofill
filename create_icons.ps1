# JobFill - PNG Icon Generator
# Run once: Right-click this file -> "Run with PowerShell"
# Generates icon16.png, icon48.png, icon128.png inside the ./icons/ folder

Add-Type -AssemblyName System.Drawing

$sizes     = @(16, 48, 128)
$outputDir = Join-Path $PSScriptRoot "icons"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

function Draw-RoundedRect {
    param($g, $rect, $radius, $brush)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $r2 = $radius * 2
    $path.AddArc($rect.X,              $rect.Y,              $r2, $r2, 180, 90)
    $path.AddArc($rect.Right - $r2,    $rect.Y,              $r2, $r2, 270, 90)
    $path.AddArc($rect.Right - $r2,    $rect.Bottom - $r2,   $r2, $r2,   0, 90)
    $path.AddArc($rect.X,              $rect.Bottom - $r2,   $r2, $r2,  90, 90)
    $path.CloseFigure()
    $g.FillPath($brush, $path)
    $path.Dispose()
}

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Background - indigo solid #4f46e5
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 79, 70, 229))
    $rect    = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $radius  = [int]([Math]::Round($size * 0.22))

    Draw-RoundedRect $g $rect $radius $bgBrush
    $bgBrush.Dispose()

    # Inner glow
    $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 255, 255, 255))
    $glowRect  = New-Object System.Drawing.Rectangle([int]($size * 0.1), [int]($size * 0.08), [int]($size * 0.8), [int]($size * 0.4))
    $g.FillEllipse($glowBrush, $glowRect)
    $glowBrush.Dispose()

    # Draw "J" letter for 32px+, white dot for 16px
    if ($size -ge 32) {
        $fontSize  = [float]($size * 0.56)
        $font      = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
        $txtBrush  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $sf        = New-Object System.Drawing.StringFormat
        $sf.Alignment     = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
        $center = [System.Drawing.PointF]::new([float]($size / 2), [float]($size / 2))
        $g.DrawString("J", $font, $txtBrush, $center, $sf)
        $font.Dispose(); $txtBrush.Dispose()
    } else {
        $wb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $dotSize = [int]($size * 0.55)
        $ox = [int](($size - $dotSize) / 2)
        $oy = [int](($size - $dotSize) / 2)
        $g.FillEllipse($wb, $ox, $oy, $dotSize, $dotSize)
        $wb.Dispose()
    }

    $g.Dispose()

    $outPath = Join-Path $outputDir "icon$size.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "  OK  icon${size}.png" -ForegroundColor Green
}

Write-Host ""
Write-Host "Icons created in: $outputDir" -ForegroundColor Cyan
Write-Host "Next: chrome://extensions -> Developer mode ON -> Load unpacked -> select this folder" -ForegroundColor Yellow
