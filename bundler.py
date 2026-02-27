#!/usr/bin/env python3
# bundle.py — entry: ./index.html, output: ./dist/index.html
#
# JS minify via Terser (AST-based) + JSON-literal minify + safe </script escaping
# HTML/CSS minify included.

from __future__ import annotations
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.resolve()

ENTRY = ROOT / "index.html"
OUT_DIR = ROOT / "dist"
OUT_HTML = OUT_DIR / "index.html"

MAKE_README_JS = ROOT / "make_readme_js.py"

AGGRESSIVE_REMOVE_INTERTAG_WHITESPACE = True

# JS minification controls
MINIFY_JS_WITH_TERSER = True
MANGLE = True            # if something breaks: set False
MANGLE_TOPLEVEL = False  # keep global names stable across files
ECMA_VERSION = "2020"    # bump if you use newer syntax

# --- Regexes ---
LINK_RE = re.compile(
    r"""<link\b([^>]*?)\brel\s*=\s*["']stylesheet["']([^>]*?)>""",
    re.IGNORECASE,
)
HREF_RE = re.compile(r"""href\s*=\s*["']([^"']+)["']""", re.IGNORECASE)

SCRIPT_RE = re.compile(
    r"""<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*</script>""",
    re.IGNORECASE | re.DOTALL,
)

RAW_BLOCK_RE = re.compile(
    r"""<(script|style|pre|textarea)\b[^>]*>.*?</\1>""",
    re.IGNORECASE | re.DOTALL,
)

TYPE_MODULE_RE = re.compile(r"""type\s*=\s*["']module["']""", re.IGNORECASE)

# --- Helpers ---
def is_external(url: str) -> bool:
    u = url.strip().lower()
    return (
        u.startswith("http://")
        or u.startswith("https://")
        or u.startswith("//")
        or u.startswith("data:")
    )

def read_text(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def minify_css(css: str) -> str:
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{}:;,])\s*", r"\1", css)
    css = css.replace(";}", "}")
    return css.strip()

def protect_raw_blocks(html: str) -> tuple[str, list[str]]:
    blocks: list[str] = []
    def repl(m: re.Match) -> str:
        blocks.append(m.group(0))
        return f"__RAW_BLOCK_{len(blocks)-1}__"
    return RAW_BLOCK_RE.sub(repl, html), blocks

def restore_raw_blocks(html: str, blocks: list[str]) -> str:
    for i, b in enumerate(blocks):
        html = html.replace(f"__RAW_BLOCK_{i}__", b)
    return html

def minify_html_markup(html: str) -> str:
    outside, blocks = protect_raw_blocks(html)
    outside = re.sub(r"<!--.*?-->", "", outside, flags=re.DOTALL)
    outside = re.sub(r"\s+", " ", outside)
    if AGGRESSIVE_REMOVE_INTERTAG_WHITESPACE:
        outside = re.sub(r">\s+<", "><", outside)
    outside = outside.strip()
    return restore_raw_blocks(outside, blocks)

# --- JSON minify inside JS (strict JSON literals only) ---
_JSON_START_PREV_CHARS = set("=([{:,;!&|?+-*/%<>^~\n\r\t ")

def _prev_nonws_char(s: str, i: int) -> str | None:
    j = i - 1
    while j >= 0 and s[j].isspace():
        j -= 1
    return s[j] if j >= 0 else None

def _extract_balanced_json_segment(s: str, start: int) -> int | None:
    opening = s[start]
    if opening not in "{[":
        return None
    stack = [opening]
    i = start + 1
    in_str = False
    esc = False
    while i < len(s):
        c = s[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c in "{[":
                stack.append(c)
            elif c in "}]":
                top = stack[-1]
                if (top == "{" and c == "}") or (top == "[" and c == "]"):
                    stack.pop()
                    if not stack:
                        return i + 1
                else:
                    return None
        i += 1
    return None

def minify_json_literals_in_js(js: str) -> str:
    out = []
    i = 0
    n = len(js)
    state = "code"  # code | line_comment | block_comment | sq | dq | bt
    esc = False

    while i < n:
        c = js[i]
        nxt = js[i + 1] if i + 1 < n else ""

        if state == "code":
            if c == "/" and nxt == "/":
                out.append(c); out.append(nxt); i += 2; state = "line_comment"; continue
            if c == "/" and nxt == "*":
                out.append(c); out.append(nxt); i += 2; state = "block_comment"; continue

            if c == "'":
                out.append(c); i += 1; state = "sq"; esc = False; continue
            if c == '"':
                out.append(c); i += 1; state = "dq"; esc = False; continue
            if c == "`":
                out.append(c); i += 1; state = "bt"; esc = False; continue

            if c in "{[":
                prev = _prev_nonws_char(js, i)
                if prev is None or prev in _JSON_START_PREV_CHARS:
                    end = _extract_balanced_json_segment(js, i)
                    if end is not None:
                        seg = js[i:end]
                        try:
                            obj = json.loads(seg)
                        except Exception:
                            out.append(c); i += 1; continue
                        out.append(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
                        i = end
                        continue

            out.append(c); i += 1; continue

        if state == "line_comment":
            out.append(c); i += 1
            if c == "\n": state = "code"
            continue

        if state == "block_comment":
            out.append(c); i += 1
            if c == "*" and nxt == "/":
                out.append(nxt); i += 1; state = "code"
            continue

        # strings/templates
        out.append(c); i += 1
        if esc:
            esc = False
            continue
        if c == "\\":
            esc = True
            continue
        if state == "sq" and c == "'": state = "code"
        elif state == "dq" and c == '"': state = "code"
        elif state == "bt" and c == "`": state = "code"

    return "".join(out)

# --- Terser integration ---
def _terser_cmd() -> list[str] | None:
    is_win = sys.platform.startswith("win")
    local = ROOT / "node_modules" / ".bin" / ("terser.cmd" if is_win else "terser")
    if local.exists():
        return [str(local)]
    # fallback: npx (needs node+npx available)
    return ["npx", "--yes", "terser"]

def terser_minify(js: str, is_module: bool) -> str:
    cmd = _terser_cmd()
    if cmd is None:
        return js

    # Build args
    args = cmd + ["--ecma", ECMA_VERSION]

    if is_module:
        args += ["--module"]

    # compress
    args += ["--compress"]

    # mangle (but keep globals stable unless you explicitly want toplevel)
    if MINIFY_JS_WITH_TERSER and MANGLE:
        m = "toplevel=true" if MANGLE_TOPLEVEL else "toplevel=false"
        args += ["--mangle", m]

    try:
        p = subprocess.run(
            args,
            input=js,
            text=True,
            capture_output=True,
            check=True,
            cwd=str(ROOT),
        )
        return p.stdout
    except Exception as e:
        # If terser fails, keep original JS so build doesn't break.
        err = getattr(e, "stderr", "") or ""
        print(f"[warn] terser failed, using unminified JS. {err}".strip(), file=sys.stderr)
        return js

# --- Inliners ---
def inline_css(html: str, base_dir: Path) -> str:
    def repl(m: re.Match) -> str:
        whole = m.group(0)
        href_m = HREF_RE.search(whole)
        if not href_m:
            return whole
        href = href_m.group(1)
        if is_external(href):
            return whole

        css_path = (base_dir / href).resolve()
        if not css_path.exists():
            raise FileNotFoundError(f"CSS not found: {href} -> {css_path}")

        css = minify_css(read_text(css_path))
        css = re.sub(r"</style", r"<\\/style", css, flags=re.IGNORECASE)
        return f"<!--inlined--><style>{css}</style>"

    return LINK_RE.sub(repl, html)

def inline_js(html: str, base_dir: Path) -> str:
    def repl(m: re.Match) -> str:
        before_attrs = m.group(1) or ""
        src = m.group(2)
        after_attrs = m.group(3) or ""

        if is_external(src):
            return m.group(0)

        js_path = (base_dir / src).resolve()
        if not js_path.exists():
            raise FileNotFoundError(f"JS not found: {src} -> {js_path}")

        js = read_text(js_path)

        # 1) minify strict JSON literals
        js = minify_json_literals_in_js(js)

        # 2) full JS minify via terser (optional)
        attrs_all = (before_attrs + " " + after_attrs)
        is_module = bool(TYPE_MODULE_RE.search(attrs_all))
        if MINIFY_JS_WITH_TERSER:
            js = terser_minify(js, is_module=is_module)

        # 3) CRITICAL: prevent premature </script> termination when inlined
        js = re.sub(r"</script", r"<\\/script", js, flags=re.IGNORECASE)

        # keep other attributes except src
        attrs = attrs_all.strip()
        attrs = re.sub(r"""\bsrc\s*=\s*["'][^"']+["']""", "", attrs, flags=re.IGNORECASE).strip()
        attrs_str = f" {attrs}" if attrs else ""

        return f"<!--inlined--><script{attrs_str}>\n{js}\n</script>"

    return SCRIPT_RE.sub(repl, html)

def main() -> int:
    if not ENTRY.exists():
        print(f"Missing entry: {ENTRY}", file=sys.stderr)
        return 2

    if MAKE_README_JS.exists():
        subprocess.run([sys.executable, str(MAKE_README_JS)], cwd=str(ROOT), check=False)

    html = read_text(ENTRY)
    base_dir = ENTRY.parent

    html = inline_css(html, base_dir)
    html = inline_js(html, base_dir)
    html = minify_html_markup(html)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_HTML.write_text(html, encoding="utf-8")
    print(f"OK: wrote {OUT_HTML}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())