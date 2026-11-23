#!/usr/bin/env python3
"""Tiny static bundler for the Innovation Lab pages.

Each page lives in _src/<name>/page.html and may pull other files in with
    @@include(relative/path)@@
(paths are relative to the page folder; includes may nest). The result is ONE
self-contained HTML file (CSS, JS, fonts all inline) written next to this
folder's parent, under the name given in pages.json.

    python3 _src/build.py            # build every page that has a page.html
    python3 _src/build.py ufuq       # build one page
"""
import json, pathlib, re, sys
SRC = pathlib.Path(__file__).resolve().parent
OUT = SRC.parent
PAGES = json.loads((SRC / 'pages.json').read_text(encoding='utf-8'))
INC = re.compile(r'@@include\(([^)]+)\)@@')

def expand(path: pathlib.Path, depth=0) -> str:
    if depth > 6: raise RuntimeError(f'include depth exceeded at {path}')
    text = path.read_text(encoding='utf-8')
    def repl(m):
        target = (path.parent / m.group(1).strip()).resolve()
        if not target.exists(): raise FileNotFoundError(f'{path}: missing include {m.group(1)}')
        return expand(target, depth + 1)
    return INC.sub(repl, text)

def build(name: str):
    page = SRC / name / 'page.html'
    if not page.exists():
        print(f'  skip {name} (no page.html yet)'); return
    html = expand(page)
    if '</script>' in re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.S | re.I):
        pass
    out = OUT / PAGES[name]
    out.write_text(html, encoding='utf-8')
    ext = re.findall(r'(?:src|href)=["\'](https?://[^"\']+)', html)
    print(f'  built {out.name}  {len(html.encode())/1024:.0f} KB' + (f'  !! external refs: {ext[:3]}' if ext else ''))

if __name__ == '__main__':
    names = sys.argv[1:] or list(PAGES)
    for n in names:
        if n not in PAGES: sys.exit(f'unknown page "{n}". known: {", ".join(PAGES)}')
        build(n)
