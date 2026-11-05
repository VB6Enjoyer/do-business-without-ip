#!/usr/bin/env python3
"""Structural check of the generated EPUB (standard library only).

Not a replacement for W3C EPUBCheck, but catches what a generator bug would
break: the container layout, well-formed XHTML, a consistent manifest and
spine, a navigation document, and internal links (footnotes and back links)
that point at real ids.

Usage: python3 -I scripts/check-epub.py dist/downloads/do-business-without-ip.epub
"""
import posixpath
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = {
    'opf': 'http://www.idpf.org/2007/opf',
    'xhtml': 'http://www.w3.org/1999/xhtml',
    'c': 'urn:oasis:names:tc:opendocument:xmlns:container',
}
errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)
    print(f'  ✗ {message}')


def ok(message: str) -> None:
    print(f'  ✓ {message}')


def main(path: str) -> None:
    z = zipfile.ZipFile(path)
    names = z.namelist()

    first = z.infolist()[0]
    if first.filename == 'mimetype' and first.compress_type == zipfile.ZIP_STORED and \
            z.read('mimetype') == b'application/epub+zip':
        ok('mimetype is first, uncompressed and correct')
    else:
        fail('mimetype must be the first entry, stored uncompressed, containing application/epub+zip')

    container = ET.fromstring(z.read('META-INF/container.xml'))
    opf_path = container.find('.//c:rootfile', NS).get('full-path')
    base = posixpath.dirname(opf_path)
    opf = ET.fromstring(z.read(opf_path))
    ok(f'container points to {opf_path}')

    for field in ('identifier', 'title', 'language'):
        if opf.find(f'.//{{http://purl.org/dc/elements/1.1/}}{field}') is None:
            fail(f'missing dc:{field}')
    if opf.find('.//opf:meta[@property="dcterms:modified"]', NS) is None:
        fail('missing dcterms:modified')

    manifest = {item.get('id'): item for item in opf.findall('.//opf:manifest/opf:item', NS)}
    for item in manifest.values():
        href = posixpath.join(base, item.get('href'))
        if href not in names:
            fail(f'manifest item missing from archive: {href}')
    if not any('nav' in (i.get('properties') or '').split() for i in manifest.values()):
        fail('no navigation document (properties="nav")')
    spine = [ref.get('idref') for ref in opf.findall('.//opf:spine/opf:itemref', NS)]
    for idref in spine:
        if idref not in manifest:
            fail(f'spine references unknown item {idref}')
    ok(f'{len(manifest)} manifest items, {len(spine)} spine entries')

    # Parse every XHTML document; collect ids and internal links.
    ids: dict[str, set[str]] = {}
    links: list[tuple[str, str]] = []
    for item in manifest.values():
        if item.get('media-type') != 'application/xhtml+xml':
            continue
        href = item.get('href')
        try:
            tree = ET.fromstring(z.read(posixpath.join(base, href)))
        except ET.ParseError as e:
            fail(f'{href} is not well-formed XML: {e}')
            continue
        ids[href] = {el.get('id') for el in tree.iter() if el.get('id')}
        for a in tree.iter(f'{{{NS["xhtml"]}}}a'):
            target = a.get('href') or ''
            if target and '://' not in target and not target.startswith('mailto:'):
                links.append((href, target))
    ok(f'{len(ids)} XHTML documents are well-formed')

    broken = 0
    for source, target in links:
        file, _, fragment = target.partition('#')
        file = file or source
        if file not in ids:
            fail(f'{source}: link to missing document {target}')
            broken += 1
        elif fragment and fragment not in ids[file]:
            fail(f'{source}: link to missing id {target}')
            broken += 1
    if not broken:
        ok(f'{len(links)} internal links resolve')

    if errors:
        print(f'\n{len(errors)} problem(s).')
        sys.exit(1)
    print('\nEPUB structure OK.')


if __name__ == '__main__':
    main(sys.argv[1])
