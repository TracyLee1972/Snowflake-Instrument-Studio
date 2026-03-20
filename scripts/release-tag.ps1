param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Version,

    [Parameter(Mandatory = $false, Position = 1)]
    [string]$Message
)

$ErrorActionPreference = 'Stop'

$tag = if ($Version.StartsWith('v')) { $Version } else { "v$Version" }
if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "Release $tag"
}

if (-not (git rev-parse --is-inside-work-tree 2>$null)) {
    Write-Error "Error: not inside a git repository."
}

if (-not (git remote get-url origin 2>$null)) {
    Write-Error "Error: git remote 'origin' is not configured."
}

if ($tag -notmatch '^v[0-9]+\.[0-9]+\.[0-9]+([-.][A-Za-z0-9._]+)?$') {
    Write-Error "Error: tag must look like vMAJOR.MINOR.PATCH (optionally with suffix). Given: $tag"
}

$localTagExists = $false
try {
    git rev-parse -q --verify "refs/tags/$tag" *> $null
    if ($LASTEXITCODE -eq 0) {
        $localTagExists = $true
    }
} catch {
    $localTagExists = $false
}

if ($localTagExists) {
    Write-Error "Error: local tag '$tag' already exists."
}

$remoteTagExists = $false
try {
    git ls-remote --exit-code --tags origin $tag *> $null
    if ($LASTEXITCODE -eq 0) {
        $remoteTagExists = $true
    }
} catch {
    $remoteTagExists = $false
}

if ($remoteTagExists) {
    Write-Error "Error: remote tag '$tag' already exists on origin."
}

git tag -a $tag -m $Message
git push origin $tag

Write-Host "Published $tag"
Write-Host "GitHub Actions will now run the release workflow for this tag."
