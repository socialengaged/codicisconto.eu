#!/usr/bin/env bash
set -euo pipefail

CRON_LINE="25 3 * * * /home/ubuntu/apps/codicisconto.eu/scripts/run-daily-imports.sh >> /home/ubuntu/apps/codicisconto.eu/logs/daily-imports.log 2>&1"

python3 - <<'PY'
import subprocess

line = "25 3 * * * /home/ubuntu/apps/codicisconto.eu/scripts/run-daily-imports.sh >> /home/ubuntu/apps/codicisconto.eu/logs/daily-imports.log 2>&1"
proc = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
lines = [item for item in proc.stdout.splitlines() if item.strip()]
if line not in lines:
    lines.append(line)
subprocess.run(["crontab", "-"], input="\n".join(lines) + "\n", text=True, check=True)
PY

crontab -l | grep "codicisconto.eu/scripts/run-daily-imports.sh"
