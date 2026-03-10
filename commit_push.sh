#!/usr/bin/env bash
set -euo pipefail

cd "/c/Users/info/Desktop/codicisconto.eu"
export GIT_AUTHOR_NAME="socialengaged"
export GIT_AUTHOR_EMAIL="32766701+socialengaged@users.noreply.github.com"
export GIT_COMMITTER_NAME="socialengaged"
export GIT_COMMITTER_EMAIL="32766701+socialengaged@users.noreply.github.com"

cat > /tmp/codicisconto-commit-msg <<'EOF'
Initial codicisconto.eu MVP.

Ship the coupon site baseline with public SEO pages, admin workflow, import pipeline, Amazon/source auditing, and production deployment assets so local, server, and GitHub can start from the same working state.
EOF

git add .
git commit -F /tmp/codicisconto-commit-msg
git push -u origin main
