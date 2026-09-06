import fitz
from pathlib import Path

src = Path('attached_assets/jrfm-19-00189_1788665746559.pdf')
out = Path('.agents/outputs/jrfm_reference_pages')
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(src)
print('pages', doc.page_count)
print('metadata', doc.metadata)
for index in range(min(doc.page_count, 8)):
    page = doc[index]
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    target = out / f'page-{index+1:02d}.png'
    pix.save(target)
    blocks = page.get_text('dict').get('blocks', [])
    text_blocks = [b for b in blocks if b.get('type') == 0]
    image_blocks = [b for b in blocks if b.get('type') == 1]
    print(f'page {index+1}: size={page.rect.width:.0f}x{page.rect.height:.0f}, text_blocks={len(text_blocks)}, image_blocks={len(image_blocks)}, chars={len(page.get_text())}')
