#!/bin/sh
set -euo pipefail

require_secret() {
  var_name="$1"
  value="$(printenv "$var_name" 2>/dev/null || true)"

  if [ -z "$value" ]; then
    echo "Environment variable $var_name is required." >&2
    exit 1
  fi

  if [ "${#value}" -lt 32 ]; then
    echo "$var_name must be at least 32 characters long." >&2
    exit 1
  fi
}

require_secret "ACCESS_TOKEN_SECRET"
require_secret "REFRESH_TOKEN_SECRET"

echo "Running database migrations..."
node dist/scripts/migrate.js run
echo "Database migrations applied."

echo "Starting application..."
exec "$@"
