Add-Type -AssemblyName System.Drawing

$brandPath = "c:\Users\User\Desktop\SAAD\studex\ChatGPT Image Jul 25, 2026, 06_04_43 PM.png"
$img = [System.Drawing.Bitmap]::FromFile($brandPath)

# 1. Crop Logo Mark (Top S Pen Nib)
$logoRect = New-Object System.Drawing.Rectangle(120, 20, 780, 530)
$logoCrop = $img.Clone($logoRect, $img.PixelFormat)
$logoCrop.Save("c:\Users\User\Desktop\SAAD\studex\public\logo-mark.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Crop Wordmark (Bottom studex text & book/pen)
$wmRect = New-Object System.Drawing.Rectangle(60, 630, 900, 340)
$wmCrop = $img.Clone($wmRect, $img.PixelFormat)
$wmCrop.Save("c:\Users\User\Desktop\SAAD\studex\public\wordmark.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 3. Create 512x512 PWA App Icon PNG
$icon512 = New-Object System.Drawing.Bitmap(512, 512)
$g512 = [System.Drawing.Graphics]::FromImage($icon512)
$g512.Clear([System.Drawing.Color]::Black)
$g512.DrawImage($logoCrop, 0, 0, 512, 512)
$icon512.Save("c:\Users\User\Desktop\SAAD\studex\public\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 4. Create 192x192 PWA App Icon PNG
$icon192 = New-Object System.Drawing.Bitmap(192, 192)
$g192 = [System.Drawing.Graphics]::FromImage($icon192)
$g192.Clear([System.Drawing.Color]::Black)
$g192.DrawImage($logoCrop, 0, 0, 192, 192)
$icon192.Save("c:\Users\User\Desktop\SAAD\studex\public\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)

$img.Dispose()
$logoCrop.Dispose()
$wmCrop.Dispose()
$icon512.Dispose()
$icon192.Dispose()
Write-Host "Brand image 'ChatGPT Image Jul 25, 2026, 06_04_43 PM.png' cropped successfully!"
