$ErrorActionPreference = "Stop"

function Invoke-Robocopy {
  param(
    [string] $Source,
    [string] $Destination,
    [string[]] $ExtraArgs = @()
  )

  robocopy $Source $Destination /E @ExtraArgs
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed with exit code $LASTEXITCODE"
  }
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempRoot = Join-Path $env:TEMP "serialforge-build"
$releaseDir = Join-Path $root "release"

Set-Location $root
npm.cmd run build

if (Test-Path $tempRoot) {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
Invoke-Robocopy -Source (Join-Path $root ".cargo") -Destination (Join-Path $tempRoot ".cargo")
Invoke-Robocopy -Source (Join-Path $root "src-tauri") -Destination (Join-Path $tempRoot "src-tauri") -ExtraArgs @("/XD", "target", "target-gnu")
Invoke-Robocopy -Source (Join-Path $root "dist") -Destination (Join-Path $tempRoot "dist")

Set-Location $tempRoot
$configPath = Join-Path $tempRoot "src-tauri\tauri.conf.json"
$tauriConfig = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$tauriConfig.build.beforeBuildCommand = ""
$tauriConfigJson = $tauriConfig | ConvertTo-Json -Depth 20
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, $tauriConfigJson, $utf8NoBom)

$tauriCli = Join-Path $root "node_modules\.bin\tauri.cmd"
$env:RUSTUP_TOOLCHAIN = "stable-x86_64-pc-windows-gnu"
& $tauriCli build --target x86_64-pc-windows-gnu --no-bundle

New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
$gnuReleaseDir = Join-Path $tempRoot "src-tauri\target\x86_64-pc-windows-gnu\release"
$fallbackReleaseDir = Join-Path $tempRoot "src-tauri\target\release"
$builtReleaseDir = if (Test-Path (Join-Path $gnuReleaseDir "serialforge.exe")) { $gnuReleaseDir } else { $fallbackReleaseDir }

Copy-Item -LiteralPath (Join-Path $builtReleaseDir "serialforge.exe") -Destination (Join-Path $releaseDir "SerialForge.exe") -Force
Copy-Item -LiteralPath (Join-Path $builtReleaseDir "WebView2Loader.dll") -Destination (Join-Path $releaseDir "WebView2Loader.dll") -Force

Write-Output "SerialForge release files:"
Get-ChildItem $releaseDir | Select-Object Name, Length, LastWriteTime
