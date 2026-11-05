#!/usr/bin/env python3
"""Generate docs/source/reference-2014.txt from the original PDF.

The reference is the guide's body text exactly as laid out in the 2014 PDF
(one PDF line per text line, reading order, no pull quotes, footnote lists,
page furniture or front matter). `npm run check:text` compares the MDX
against it.

Usage (requires poppler's pdftohtml):
    python3 -I scripts/extract-reference.py path/to/original.pdf docs/source/reference-2014.txt
"""
import html
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# Font ids in pdftohtml -xml output for the 2014 PDF.
HEADINGS = {'17', '24', '25'}
BODY = {'18', '19', '20', '21', '22', '26', '27', '28', '33'}
FOOTNOTE_MARK = '29'  # superscript numbers: dropped, but they separate words


def main(pdf: str, out: str) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp) / 'guide'
        subprocess.run(['pdftohtml', '-xml', '-i', '-q', pdf, str(base)], check=True)
        xml = base.with_suffix('.xml').read_text(encoding='utf-8')

    lines: dict[tuple[int, int], list[tuple[int, str]]] = {}
    page = 0
    for raw in xml.splitlines():
        m = re.match(r'<page number="(\d+)"', raw)
        if m:
            page = int(m[1])
            continue
        m = re.match(r'<text top="(\d+)" left="(\d+)"[^>]*font="(\d+)">(.*)</text>', raw.strip())
        if not m or page < 3:
            continue
        top, left, font, inner = int(m[1]), int(m[2]), m[3], m[4]
        if font == FOOTNOTE_MARK:
            inner = ' '
        elif font not in BODY | HEADINGS:
            continue
        text = html.unescape(re.sub(r'<[^>]+>', '', inner))
        if not text.strip() and font != FOOTNOTE_MARK:
            continue
        key = next((k for k in lines if k[0] == page and abs(k[1] - top) <= 4), (page, top))
        lines.setdefault(key, []).append((left, text))

    result, current_page, drop_cap = [], None, ''
    for (pg, _), parts in sorted(lines.items()):
        if pg != current_page:
            result.append(f'[[page {pg}]]')
            current_page = pg
        text = re.sub(r' {2,}', ' ', ''.join(t for _, t in sorted(parts))).strip()
        if not text:
            continue
        if re.fullmatch(r'[A-Z]', text):  # drop cap: belongs to the next line
            drop_cap = text
            continue
        result.append(drop_cap + text)
        drop_cap = ''
    Path(out).write_text('\n'.join(result) + '\n', encoding='utf-8')
    print(f'wrote {len(result)} lines to {out}')


if __name__ == '__main__':
    main(*sys.argv[1:3])
