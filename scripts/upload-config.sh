#!/usr/bin/env bash
# Upload dashrock.config.yaml to the data bucket so the collector can read it.
#
# Usage:
#   ./scripts/upload-config.sh              # uses production stage (default)
#   ./scripts/upload-config.sh dev          # uses dev stage
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
STAGE="${1:-production}"

cd "$REPO_ROOT"

CONFIG_FILE="dashrock.config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: $CONFIG_FILE not found. Copy dashrock.config.example.yaml and edit it."
  exit 1
fi

# Get bucket name from SST output
BUCKET=$(npx sst shell --stage "$STAGE" -- printenv DATA_BUCKET 2>/dev/null || true)
if [ -z "$BUCKET" ]; then
  # Fallback: parse from `sst output`
  BUCKET=$(npx sst output --stage "$STAGE" 2>/dev/null | grep bucket | awk '{print $NF}' || true)
fi

if [ -z "$BUCKET" ]; then
  echo "Error: Could not determine DATA_BUCKET for stage '$STAGE'."
  echo "Make sure you have deployed first: npm run deploy"
  exit 1
fi

echo "Uploading $CONFIG_FILE to s3://$BUCKET/config.yaml"
aws s3 cp "$CONFIG_FILE" "s3://$BUCKET/config.yaml" --content-type "application/x-yaml"
echo "Done! The collector will use this config on the next run."
