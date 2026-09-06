"""Regenerate the local-export image after changing img/tile.png."""
import base64
from pathlib import Path

root = Path(__file__).resolve().parent.parent
encoded = base64.b64encode((root / 'img/tile.png').read_bytes()).decode('ascii')
(root / 'export-image.js').write_text(
    '// Generated from img/tile.png by scripts/update-export-image.py.\n'
    f'window.localExportTile = "data:image/png;base64,{encoded}";\n'
)
