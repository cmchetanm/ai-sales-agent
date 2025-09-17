#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-development}"
ENV_FILE="ops/env/.env.${ENVIRONMENT}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing environment file: ${ENV_FILE}" >&2
  exit 1
fi

echo "Bootstrap tasks for ${ENVIRONMENT} are placeholders and will be expanded." 
