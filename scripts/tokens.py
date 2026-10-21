from pathlib import Path
import re, sys
p = Path(__file__).resolve().parents[1]
text = (p/'DESIGN.md').read_text()
front = text.split('---', 2)[1]
values = {}
section = ''
for line in front.splitlines():
    if line and not line.startswith(' '): section = line.split(':')[0]
    m = re.match(r"  ([\w-]+): '([^']+)'$", line)
    if m and section in ('colors', 'rounded', 'spacing'):
        prefix = {'colors':'color', 'rounded':'radius', 'spacing':'space'}[section]
        values[prefix+'-'+m[1]] = m[2]
fonts = re.findall(r"  (\w+):\n    fontFamily: '([^']+)'", front)
values.update({'font-'+name: family for name, family in fonts})
css = '/* Generated from DESIGN.md by scripts/tokens.py. */\n:root {\n' + ''.join(f'  --{key}: {value};\n' for key,value in values.items()) + '}\n'
out=p/'dist/tokens.css'
if '--check' in sys.argv:
    assert out.read_text() == css, 'Token drift detected'
    print('Token mapping: passed')
else: out.write_text(css)
