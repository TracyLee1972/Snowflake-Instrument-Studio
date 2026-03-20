#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <version|tag> [message]"
  echo "Example: $0 1.0.1"
  echo "Example: $0 v1.0.1 \"Release v1.0.1\""
  exit 1
fi

raw_version="$1"
tag="$raw_version"
if [[ "$tag" != v* ]]; then
  tag="v$tag"
fi

message="${2:-Release $tag}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository."
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Error: git remote 'origin' is not configured."
  exit 1
fi

if ! [[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([-.][A-Za-z0-9._]+)?$ ]]; then
  echo "Error: tag must look like vMAJOR.MINOR.PATCH (optionally with suffix)."
  echo "Given: $tag"
  exit 1
fi

if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
  echo "Error: local tag '$tag' already exists."
  exit 1
fi

if git ls-remote --exit-code --tags origin "$tag" >/dev/null 2>&1; then
  echo "Error: remote tag '$tag' already exists on origin."
  exit 1
fi

git tag -a "$tag" -m "$message"
git push origin "$tag"

echo "Published $tag"
echo "GitHub Actions will now run the release workflow for this tag."
