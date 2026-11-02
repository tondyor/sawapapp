# Patches the @tgcloud/cli 0.2.0 Windows bug: on a targeted push the server
# response contains `false` instead of a string for unchanged modules and the
# CLI crashes (ERR_INVALID_ARG_TYPE in snapshot.js).
# Run after every `npm install`:  powershell -File scripts\patch-tgcloud-cli.ps1

$ErrorActionPreference = 'Stop'
$target = Join-Path $PSScriptRoot '..\node_modules\@tgcloud\cli\src\core\snapshot.js'
$target = [System.IO.Path]::GetFullPath($target)

if (-not (Test-Path -LiteralPath $target)) {
  Write-Host "snapshot.js not found at $target - nothing to patch"
  exit 0
}

$content = [System.IO.File]::ReadAllText($target)
if ($content.Contains('[tgcloud-patch]')) {
  Write-Host 'tgcloud CLI already patched'
  exit 0
}

$old = 'export function writeSnapshotFile(relPath, content) {'
$new = @'
export function writeSnapshotFile(relPath, content) {
  if (typeof content !== 'string') {
    console.error(`[tgcloud-patch] skip ${relPath}: non-string content (CLI 0.2.0 Windows bug)`);
    return;
  }
'@

if (-not $content.Contains($old)) {
  Write-Host 'Unexpected snapshot.js layout - patch not applied'
  exit 1
}

$content = $content.Replace($old, $new)
[System.IO.File]::WriteAllText($target, $content)
Write-Host 'tgcloud CLI patched (non-string snapshot content is skipped instead of crashing)'
