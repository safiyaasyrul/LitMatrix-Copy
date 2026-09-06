import fitz, re
from pathlib import Path
src = Path('attached_assets/jrfm-19-00189_1788665746559.pdf')
out = Path('.agents/outputs/jrfm_reference_pages')
doc = fitz.open(src)
for index in [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]:
    page = doc[index]
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5,1.5), alpha=False)
    pix.save(out / f'page-{index+1:02d}.png')
print('STRUCTURE ONLY')
for i, page in enumerate(doc, start=1):
    text = page.get_text()
    headings=[]
    for line in text.splitlines():
        s=' '.join(line.split())
        if re.match(r'^(?:\d+|[A-Z])(?:\.\d+)*\.?\s+[A-Z][A-Za-z]', s) and len(s)<140:
            headings.append(s)
        elif re.match(r'^(?:Figure|Table)\s+\d+', s, re.I):
            headings.append(s)
    if headings:
        print(f'page {i}: ' + ' | '.join(headings[:8]))
