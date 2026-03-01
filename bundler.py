#!/usr/bin/env python3
# bundler.py — entry: ./index.html, output: ./dist/index.html
# Inlines all local <link rel="stylesheet"> and <script src="…"> references.
# No minification — files are inlined as-is for easy debugging.

from __future__ import annotations
import re
import subprocess
import sys
from pathlib import Path

ROOT     = Path(__file__).parent.resolve()
ENTRY    = ROOT / "index.html"
OUT_DIR  = ROOT / "dist"
OUT_HTML = OUT_DIR / "index.html"
MAKE_README_JS = ROOT / "make_readme_js.py"

LINK_RE   = re.compile(r"""<link\b([^>]*?)\brel\s*=\s*["']stylesheet["']([^>]*?)>""", re.IGNORECASE)
HREF_RE   = re.compile(r"""href\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
SCRIPT_RE = re.compile(r"""<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*</script>""",
                        re.IGNORECASE | re.DOTALL)

def is_external(url: str) -> bool:
    return url.strip().lower().startswith(("http://", "https://", "//", "data:"))

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def inline_css(html: str, base: Path) -> str:
    def repl(m: re.Match) -> str:
        href_m = HREF_RE.search(m.group(0))
        if not href_m or is_external(href_m.group(1)):
            return m.group(0)
        css = read((base / href_m.group(1)).resolve())
        css = css.replace("</style", "<\\/style")
        return f"<style>\n{css}\n</style>"
    return LINK_RE.sub(repl, html)

def inline_js(html: str, base: Path) -> str:
    def repl(m: re.Match) -> str:
        src = m.group(2)
        if is_external(src):
            return m.group(0)
        js = read((base / src).resolve())
        js = js.replace("</script", "<\\/script")
        attrs = re.sub(r"""\bsrc\s*=\s*["'][^"']+["']""", "",
                       (m.group(1) + " " + m.group(3)).strip()).strip()
        return f"<script{' ' + attrs if attrs else ''}>\n{js}\n</script>"
    return SCRIPT_RE.sub(repl, html)

def main() -> int:
    if not ENTRY.exists():
        print(f"Missing entry: {ENTRY}", file=sys.stderr)
        return 2

    if MAKE_README_JS.exists():
        print("Running make_readme_js.py …")
        subprocess.run([sys.executable, str(MAKE_README_JS)], cwd=str(ROOT), check=False)

    html = read(ENTRY)
    html = inline_css(html, ENTRY.parent)
    html = inline_js(html, ENTRY.parent)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_HTML.write_text(html, encoding="utf-8")

    import time as _time
    (OUT_DIR / "version.txt").write_text(str(int(_time.time())), encoding="utf-8")
    size = OUT_HTML.stat().st_size
    print(f"OK  {OUT_HTML}  ({size:,} bytes)")
    return 0

def _source_files():
    files = [ENTRY, MAKE_README_JS]
    for pattern in ("js/*.js", "css/*.css", "lang/*.js"):
        files.extend(ROOT.glob(pattern))
    return [f for f in files if f.exists()]

def _mtimes(files):
    out = {}
    for f in files:
        try: out[f] = f.stat().st_mtime
        except OSError: pass
    return out

def watch() -> int:
    import time
    print("Bundler watch mode — rebuilding on file changes (Ctrl+C to stop)")
    main()
    last = _mtimes(_source_files())
    while True:
        time.sleep(1)
        curr = _mtimes(_source_files())
        if any(last.get(f) != curr.get(f) for f in set(last) | set(curr)):
            print(f"\nFile changed — rebuilding …")
            main()
            last = _mtimes(_source_files())

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--watch":
        try:
            raise SystemExit(watch())
        except KeyboardInterrupt:
            print("\nWatch stopped.")
            raise SystemExit(0)
    raise SystemExit(main())
