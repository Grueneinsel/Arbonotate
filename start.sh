#!/usr/bin/env bash
set -e

echo "========================================"
echo "  CoNLL-U Vergleich"
echo "  http://localhost:8000/dist/"
echo "  Beenden: Strg+C"
echo "========================================"
echo

# dev_run.py starts bundler watch + HTTP server together.
# Both stop automatically when Ctrl+C is pressed.

if command -v python >/dev/null 2>&1; then
  python dev_run.py || python3 dev_run.py
else
  python3 dev_run.py
fi

# Windows-"pause" Ersatz:
read -r -p "Beendet. Enter drücken zum Schließen..." _
