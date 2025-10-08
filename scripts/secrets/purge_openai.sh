#!/usr/bin/env bash
set -euo pipefail

echo "This script rewrites git history to purge leaked secrets."
echo "Prereq: Install git-filter-repo (https://github.com/newren/git-filter-repo)."

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo not found. Install via brew install git-filter-repo or pipx install git-filter-repo" >&2
  exit 1
fi

echo "Purging tracked env file ops/env/.env.development from history..."
git filter-repo --force --path ops/env/.env.development --invert-paths

echo "Optionally, redact any residual OpenAI key strings in other files (edit secrets.txt first)."
cat > /tmp/secrets.txt <<EOF
# Replace exact leaked tokens or regex patterns; example:
# literal:sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX==>REDACTED
EOF

echo "If you added entries to /tmp/secrets.txt, run: git filter-repo --replace-text /tmp/secrets.txt"
echo "Then force-push: git push --force-with-lease origin master"
