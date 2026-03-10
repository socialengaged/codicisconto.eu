#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/apps/codicisconto.eu"
ENV_FILE="$APP_DIR/.env.production"
BASE_URL="https://codicisconto.eu"
LOG_DIR="/home/ubuntu/apps/codicisconto.eu/logs"
ADMIN_COOKIE_NAME="codicisconto_admin_session"

mkdir -p "$LOG_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

ADMIN_COOKIE_VALUE="$(python3 - "$ENV_FILE" <<'PY'
import hashlib
import hmac
import sys
import time

env_path = sys.argv[1]
data = {}
with open(env_path, "r", encoding="utf-8") as handle:
    for raw_line in handle:
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        data[key] = value

username = data.get("ADMIN_USERNAME")
secret = data.get("ADMIN_SESSION_SECRET")
if not username or not secret:
    raise SystemExit(1)

payload = f"{username}:{int(time.time() * 1000)}"
signature = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
print(f"{payload}.{signature}")
PY
)"

if [[ -z "$ADMIN_COOKIE_VALUE" ]]; then
  echo "Unable to generate admin cookie from $ENV_FILE" >&2
  exit 1
fi

for endpoint in \
  "/api/admin/import/bootstrap" \
  "/api/admin/import/bootstrap-telegram" \
  "/api/admin/import/cleanup" \
  "/api/admin/import/enrich"
do
  echo "Running $endpoint"
  http_code="$(
    curl -sS -o /dev/null -w "%{http_code}" \
      -H "Cookie: $ADMIN_COOKIE_NAME=$ADMIN_COOKIE_VALUE" \
      -X POST "$BASE_URL$endpoint"
  )"
  case "$http_code" in
    200|201|202|204|301|302|303|307|308) ;;
    *)
      echo "Unexpected HTTP status $http_code for $endpoint" >&2
      exit 1
      ;;
  esac
done

echo "Daily import pipeline completed."
