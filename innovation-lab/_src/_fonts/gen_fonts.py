"""Generate self-contained @font-face CSS (base64 woff2) from installed @fontsource packages.
Usage: python3 gen_fonts.py <node_modules dir>   (only needed if fonts must be regenerated)
All fonts are SIL Open Font License."""
import re, sys, base64, pathlib
nm = pathlib.Path(sys.argv[1]); out = pathlib.Path(__file__).parent
SETS = {
  # key: (package, css files, subsets)
  'alexandria': ('@fontsource-variable/alexandria', ['wght.css'], ['arabic','latin']),
  'readex':     ('@fontsource-variable/readex-pro', ['wght.css'], ['arabic','latin']),
  'kufi':       ('@fontsource-variable/noto-kufi-arabic', ['wght.css'], ['arabic','latin']),
  'naskh':      ('@fontsource-variable/noto-naskh-arabic', ['wght.css'], ['arabic','latin']),
  'plex':       ('@fontsource/ibm-plex-sans-arabic', ['400.css','500.css','600.css','700.css'], ['arabic','latin']),
  'plexmono':   ('@fontsource/ibm-plex-mono', ['400.css','500.css','600.css'], ['latin']),
  'zain':       ('@fontsource/zain', ['300.css','400.css','700.css','800.css'], ['arabic','latin']),
}
for key,(pkg,files,subsets) in SETS.items():
    css_out=[]; fam=None
    for f in files:
        css=(nm/pkg/f).read_text()
        for m in re.finditer(r'@font-face\s*\{.*?\}', css, re.S):
            block = m.group(0)
            u = re.search(r'url\(\./files/([^)]+\.woff2)\)', block)
            sm = re.search(r'-(arabic|latin)-(wght|\d+)-normal\.woff2$', u.group(1))
            if not sm or sm.group(1) not in subsets: continue
            data = base64.b64encode((nm/pkg/'files'/u.group(1)).read_bytes()).decode()
            block = re.sub(r'src:.*?;', f"src: url(data:font/woff2;base64,{data}) format('woff2');", block, count=1, flags=re.S)
            block = block.replace(' Variable\'', '\'')
            fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
            css_out.append(block)
    (out/f'{key}.css').write_text(f"/* {fam} — embedded (SIL OFL) */\n"+"\n".join(css_out)+"\n")
    print(key, '->', fam, round((out/f'{key}.css').stat().st_size/1024), 'KB')
