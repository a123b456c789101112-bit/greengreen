"""Build a standalone, offline preview ZIP containing only index.html."""
from pathlib import Path
import base64
import json
import mimetypes
import sys
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/greengreen-single')
output.mkdir(parents=True, exist_ok=True)
assets = {}
for path in sorted((root / 'assets').iterdir()):
    if path.is_file():
        mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        assets['assets/' + path.name] = 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()
hydrate = '''
(function hydrate(value) {
  for (const key of Object.keys(value)) {
    const item = value[key];
    if (typeof item === 'string' && bundledAssets[item]) value[key] = bundledAssets[item];
    else if (item && typeof item === 'object') hydrate(item);
  }
})(window.CONTENT);
'''
content = (root / 'content.js').read_text()
app = (root / 'app.js').read_text()
# In the offline bundle only, the actual image bytes serve as the download source.
app = app.replace("if (!path) return null;", "if (!path) return null;\n  if (path.startsWith('data:image/')) return path;")
# Keep the placeholder badge in the standalone version as well.
app = app.replace("item.image.includes('placeholder.svg')", "item.image === bundledAssets['assets/placeholder.svg']")
script = 'const bundledAssets = ' + json.dumps(assets, ensure_ascii=False) + ';\n' + content + hydrate + app
script = script.replace('</script', '<\\/script')
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (root / 'style.css').read_text() + '</style>')
html = html.replace('<script src="content.js" defer></script><script src="app.js" defer></script>', '')
html = html.replace('</body>', '<script>' + script + '</script></body>')
(output / 'index.html').write_text(html)
with ZipFile(output / 'greengreen.zip', 'w', ZIP_DEFLATED) as archive:
    archive.write(output / 'index.html', 'index.html')
print('Created standalone index.html and ZIP (one file).')
