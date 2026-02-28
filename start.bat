@echo off
echo ========================================
echo  CoNLL-U Vergleich
echo  http://localhost:8000/dist/
echo  Beenden: Strg+C
echo ========================================
echo.

REM dev_run.py starts bundler watch + HTTP server together.
REM Both stop automatically when Ctrl+C is pressed.
python dev_run.py
if errorlevel 1 (
  python3 dev_run.py
)
pause
