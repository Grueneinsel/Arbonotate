@echo off
echo ========================================
echo  CoNLL-U Vergleich
echo  http://localhost:8000
echo  Beenden: Strg+C
echo ========================================
echo.
start "" http://localhost:8000
python -m http.server 8000
if errorlevel 1 (
  python3 -m http.server 8000
)
pause
