#!/usr/bin/env bash
# Deploy Dashrock to AWS with SST (OpenNext → Lambda + CloudFront).
#
# Deploy:
#   ./scripts/deploy.sh              # deploys to production stage (default)
#   ./scripts/deploy.sh dev          # deploys to dev stage
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
STAGE="${1:-${DASHROCK_STAGE:-production}}"

cd "$REPO_ROOT"

echo "=== Deploying Dashrock with SST to stage: $STAGE ==="
npx sst deploy --stage "$STAGE"

echo ""
echo "=== Deploy complete ==="
echo "Run 'npx sst open --stage $STAGE' to open the app URL, or check the output above for the CloudFront URL."
