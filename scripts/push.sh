#!/usr/bin/env bash
# Push main to GitHub from the command line, so scheduled runs do not need
# GitHub Desktop or an unlocked screen. See "Pushing" in REVIEW-LOOP.md.
#
# Reads a fine-grained GitHub token (repo nctarski/matter, Contents: write)
# from .secrets/github-token, which is git-ignored. The token is passed to git
# through a one-off credential helper and is never written to git config, the
# remote URL, or the output.
#
# Exit codes: 0 pushed (or already up to date), 2 no token file, other = git
# push failed (message printed).
set -u
cd "$(dirname "$0")/.."
ROOT="$PWD"
TOKEN_FILE="${MATTER_TOKEN_FILE:-$ROOT/.secrets/github-token}"

if [ ! -s "$TOKEN_FILE" ]; then
  echo "push.sh: no token at $TOKEN_FILE. Fall back to GitHub Desktop." >&2
  exit 2
fi

marker="$(mktemp)"
GIT_TERMINAL_PROMPT=0 git \
  -c credential.helper= \
  -c "credential.helper=!f() { test \"\$1\" = get || exit 0; echo username=x-access-token; printf 'password='; tr -d '[:space:]' < '$TOKEN_FILE'; echo; }; f" \
  push origin main 2>&1 | grep -v -i -E 'token|password'
status=${PIPESTATUS[0]}

# The shell that runs this cannot delete files in the connected folder, so git
# leaves its lock files behind. Rename only the ones this push created, so
# later git commands (and GitHub Desktop) do not fail with "File exists".
ts="$(date +%s)"
find .git -name '*.lock' -type f -newer "$marker" 2>/dev/null | while read -r f; do
  mv "$f" ".git/stale-$ts-$(printf '%s' "${f#.git/}" | tr '/' '_')" 2>/dev/null
done
rm -f "$marker" 2>/dev/null

git status -sb | head -1
exit "$status"
