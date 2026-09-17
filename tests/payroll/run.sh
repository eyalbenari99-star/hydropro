#!/usr/bin/env bash
# Runs the payroll regression suite against ../../index.html.
# Needs: node, python3, playwright-core (npm i in tests/), and a Chromium at $CHROME
# (defaults to the Playwright chromium in /opt/pw-browsers). Exit 1 on any failure.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PORT="${PORT:-8799}"
export NODE_PATH="${NODE_PATH:-$HERE/../node_modules}"
( cd "$ROOT" && python3 -m http.server "$PORT" >/dev/null 2>&1 ) &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
for i in 1 2 3 4 5 6 7 8 9 10; do curl -s -o /dev/null "http://127.0.0.1:$PORT/index.html" && break; sleep 1; done
node "$HERE/../bridge/parse_rows.test.js" || exit 1
PORT="$PORT" node "$HERE/run.js" "$@"
