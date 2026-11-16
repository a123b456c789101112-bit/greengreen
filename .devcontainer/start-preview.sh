#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! curl --fail --silent http://127.0.0.1:3000/index.html >/dev/null; then
  nohup python3 -m http.server 3000 --bind 0.0.0.0 --directory "$PWD" >/tmp/greengreen-preview.log 2>&1 &
fi
for attempt in {1..30}; do
  if curl --fail --silent http://127.0.0.1:3000/index.html >/dev/null; then
    echo '綠綠網站已啟動，請在「連接埠 / Ports」開啟 3000。保持連接埠可見度為 Private。'
    exit 0
  fi
  sleep 1
done
echo '網站尚未啟動，請查看 /tmp/greengreen-preview.log。' >&2
exit 1
