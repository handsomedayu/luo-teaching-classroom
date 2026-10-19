param(
  [Parameter(Mandatory = $true)]
  [string]$Message
)
$ErrorActionPreference = 'Stop'
Push-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
try {
  $branch = (& git branch --show-current).Trim()
  if ($LASTEXITCODE -ne 0 -or $branch -notmatch '^(codex|muse)/') {
    throw "Only codex/* or muse/* preview branches are allowed. Current branch: $branch"
  }
  $remote = (& git remote get-url origin).Trim()
  if ($LASTEXITCODE -ne 0 -or $remote -notmatch 'handsomedayu/luo-teaching-classroom') {
    throw 'Expected the luo-teaching-classroom GitHub repository as origin.'
  }
  $staged = @(& git diff --cached --name-only --diff-filter=ACMRD)
  if ($LASTEXITCODE -ne 0 -or $staged.Count -eq 0) {
    throw 'Nothing staged: Codex must explicitly git add the intended files first (never git add -A).'
  }
  foreach ($file in $staged) {
    if ($file -match '(^|/)(\.env|\.git|node_modules|test-results|dist-review)(/|$)|\.(zip|7z|rar|key|pem|p12)$') {
      throw "Forbidden staged file: $file"
    }
  }
  & git diff --cached --check
  if ($LASTEXITCODE -ne 0) { throw 'Staged diff contains whitespace errors.' }
  & node tools/build-review-preview.cjs
  if ($LASTEXITCODE -ne 0) { throw 'Review preview build failed; nothing pushed.' }
  & node tests/science.cjs
  if ($LASTEXITCODE -ne 0) { throw 'Science check failed; nothing pushed.' }
  $report = Get-Content -Raw 'test-results/science-results.json' | ConvertFrom-Json
  if ($report.failed -ne 0) { throw "Science checks include $($report.failed) failures; nothing pushed." }
  # The calling Codex task must also have passed the relevant targeted browser
  # interaction tests before using this helper; this baseline is not sufficient.
  & git commit -m $Message
  if ($LASTEXITCODE -ne 0) { throw 'Git commit failed.' }
  & git push -u origin $branch
  if ($LASTEXITCODE -ne 0) { throw 'Git push failed; do not claim Cloudflare was updated.' }
  $sha = (& git rev-parse HEAD).Trim()
  Write-Host "Preview candidate pushed: $branch @ $sha"
  Write-Host 'Cloudflare Pages will build automatically. Wait for GitHub Cloudflare check to succeed and report the actual URL.'
}
finally { Pop-Location }
