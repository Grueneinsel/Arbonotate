#!/usr/bin/env python3
"""dev_run.py — starts HTTP server + bundler watch mode as linked processes.
When the server stops (Ctrl+C or exit), the bundler is terminated automatically."""
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).parent.resolve()

def main():
    bundler = None
    server  = None
    try:
        # Start bundler watch mode (background, same lifetime)
        bundler = subprocess.Popen(
            [sys.executable, str(ROOT / "bundler.py"), "--watch"],
            cwd=str(ROOT)
        )

        # Give bundler time to do the first build before opening the browser
        time.sleep(2)

        # Open browser
        webbrowser.open("http://localhost:8000/dist/")

        # Start HTTP server in foreground
        server = subprocess.Popen(
            [sys.executable, "-m", "http.server", "8000"],
            cwd=str(ROOT)
        )
        print("Server running at http://localhost:8000/dist/ — press Ctrl+C to stop")
        server.wait()

    except KeyboardInterrupt:
        print("\nStopping …")
    finally:
        for p in (server, bundler):
            if p and p.poll() is None:
                try:
                    p.terminate()
                    p.wait(timeout=3)
                except Exception:
                    try: p.kill()
                    except Exception: pass
        print("Beendet.")

if __name__ == "__main__":
    main()
