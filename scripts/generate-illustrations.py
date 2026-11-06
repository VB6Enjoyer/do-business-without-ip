#!/usr/bin/env python3
"""Generates the site's line-art illustrations into src/assets/illustrations/.

One style throughout: monoline strokes in the accent green, a single orange
highlight, "paper" fills that match the page surface, and ink for anything that
stands for state power. Colors are CSS custom properties (--ill-*, defined in
src/styles/tokens.css), so every drawing follows the light/dark theme.

Usage: python3 -I scripts/generate-illustrations.py
"""
import math
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'src' / 'assets' / 'illustrations'

INK = 'var(--ill-ink)'
ACC = 'var(--ill-accent)'
SOFT = 'var(--ill-soft)'
PAPER = 'var(--ill-paper)'
MUTED = 'var(--ill-muted)'
ORANGE = 'var(--ill-orange)'

W, H, GROUND = 1200, 360, 320  # section openers


# ------------------------------------------------------------------ primitives
def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none" '
            f'stroke-linecap="round" stroke-linejoin="round"><title>{title}</title>{body}</svg>\n')


def line(x1, y1, x2, y2, c=ACC, w=4, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}"{d}/>'


def path(d, c=ACC, w=4, fill='none', dash=None):
    ds = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<path d="{d}" stroke="{c}" stroke-width="{w}" fill="{fill}"{ds}/>'


def circle(cx, cy, r, c=ACC, w=4, fill='none'):
    stroke = f' stroke="{c}" stroke-width="{w}"' if c else ''
    return f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fill}"{stroke}/>'


def rect(x, y, w, h, c=ACC, sw=4, fill=PAPER, rx=0):
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" '
            f'fill="{fill}" stroke="{c}" stroke-width="{sw}"/>')


def ground(x1=60, x2=1140):
    return line(x1, GROUND, x2, GROUND, w=3)


def bulb(cx, cy, r, lit=True, sw=4, glow=True):
    neck = r * 0.42
    top = cy + r * 0.78
    g = []
    if lit and glow:
        g.append(circle(cx, cy, r * 1.55, c=None, fill=SOFT))
    g.append(path(
        f'M{cx-neck:.1f},{top:.1f} C{cx-neck:.1f},{cy+r*0.45:.1f} {cx-r:.1f},{cy+r*0.25:.1f} {cx-r:.1f},{cy:.1f} '
        f'A{r},{r} 0 1 1 {cx+r:.1f},{cy:.1f} C{cx+r:.1f},{cy+r*0.25:.1f} {cx+neck:.1f},{cy+r*0.45:.1f} {cx+neck:.1f},{top:.1f} Z',
        w=sw, fill=PAPER))
    for i in range(3):
        y = top + sw + 2 + i * max(r * 0.16, sw + 2)
        g.append(line(cx - neck * 0.95, y, cx + neck * 0.95, y, w=sw))
    g.append(path(
        f'M{cx-neck*0.5:.1f},{top-2:.1f} L{cx-neck*0.35:.1f},{cy+r*0.1:.1f} '
        f'q{neck*0.17:.1f},-{r*0.25:.1f} {neck*0.35:.1f},0 t{neck*0.35:.1f},0 L{cx+neck*0.5:.1f},{top-2:.1f}',
        c=ORANGE if lit else MUTED, w=sw * 0.8))
    return ''.join(g)


def rays(cx, cy, r1, r2, start, end, n, c=ORANGE, w=4):
    out = []
    for i in range(n):
        a = math.radians(start + (end - start) * i / max(1, n - 1))
        out.append(line(cx + r1 * math.cos(a), cy + r1 * math.sin(a),
                        cx + r2 * math.cos(a), cy + r2 * math.sin(a), c=c, w=w))
    return ''.join(out)


def padlock(cx, cy, s, c=INK, opened=False, sw=4):
    body = rect(cx - s * 0.5, cy, s, s * 0.8, c=c, sw=sw, rx=s * 0.12)
    if opened:
        shackle = path(f'M{cx-s*0.3:.1f},{cy} v-{s*0.35:.1f} a{s*0.3:.1f},{s*0.3:.1f} 0 0 1 {s*0.6:.1f},0 v-{s*0.15:.1f}',
                       c=c, w=sw)
    else:
        shackle = path(f'M{cx-s*0.3:.1f},{cy} v-{s*0.25:.1f} a{s*0.3:.1f},{s*0.3:.1f} 0 0 1 {s*0.6:.1f},0 v{s*0.25:.1f}',
                       c=c, w=sw)
    hole = circle(cx, cy + s * 0.35, s * 0.08, c=None, fill=c) + line(cx, cy + s * 0.4, cx, cy + s * 0.55, c=c, w=sw)
    return shackle + body + hole


def house(x, w, h, fill=PAPER, c=ACC, sw=4):
    roof = h * 0.45
    return (path(f'M{x},{GROUND} V{GROUND-h+roof} L{x+w/2},{GROUND-h} L{x+w},{GROUND-h+roof} V{GROUND} Z',
                 c=c, w=sw, fill=fill)
            + path(f'M{x+w/2-w*0.11},{GROUND} v-{h*0.32} h{w*0.22} v{h*0.32}', c=c, w=sw))


def person(x, h, c=ACC, sw=4):
    head = h * 0.13
    return (circle(x, GROUND - h + head, head, c=c, w=sw, fill=PAPER)
            + path(f'M{x-h*0.2:.1f},{GROUND} v-{h*0.38:.1f} a{h*0.2:.1f},{h*0.2:.1f} 0 0 1 {h*0.4:.1f},0 v{h*0.38:.1f}',
                   c=c, w=sw, fill=PAPER))


def tower(x, w, h, sw=4):
    out = [rect(x, GROUND - h, w, h, c=INK, sw=sw)]
    rows = int((h - 30) / 36)
    for r in range(rows):
        for col in range(3):
            out.append(rect(x + 14 + col * (w - 28) / 3 + 2, GROUND - h + 20 + r * 36,
                            (w - 28) / 3 - 8, 18, c=INK, sw=2.5, fill='none'))
    return ''.join(out)


def doc(x, y, w, h, rot=0, sw=3):
    lines = ''.join(line(x + 10, y + 16 + i * 12, x + w - 10 - (i % 3) * 8, y + 16 + i * 12, w=2)
                    for i in range(int((h - 22) / 12)))
    return (f'<g transform="rotate({rot} {x+w/2:.1f} {y+h/2:.1f})">'
            f'{rect(x, y, w, h, sw=sw)}{lines}</g>')


# ------------------------------------------------------------------ hero
def hero():
    b = []
    main = (200, 150, 58)
    lamps = [(70, 315, 24), (150, 345, 24), (250, 345, 24), (330, 315, 24),
             (110, 440, 18), (200, 455, 18), (290, 440, 18)]
    for (x, y, r) in lamps:
        b.append(path(f'M{main[0]},{main[1]+main[2]*1.2} C{main[0]},{(main[1]+y)/2+20} {x},{(main[1]+y)/2-10} {x},{y-r*1.1}',
                      w=2, dash='2 7'))
    b.append(bulb(*main, sw=4))
    for lamp in lamps:
        b.append(bulb(*lamp, sw=2.5))
    b.append(rays(200, 150, 100, 120, 200, 340, 9, w=3))
    return svg(400, 500, ''.join(b), 'One lit bulb lighting a cascade of others: an idea copied loses nothing')


# ------------------------------------------------------------------ openers
def introduction():
    cx, cy = 600, 175
    b = [ground(), rays(cx, cy, 128, 150, 205, 335, 9)]
    b.append(bulb(cx, cy, 62))
    # cage around the idea
    b.append(path(f'M500,300 V150 A100,100 0 0 1 700,150 V300', w=4))
    for x in range(525, 700, 25):
        top = 150 - math.sqrt(100**2 - (x - 600)**2)  # follow the dome
        b.append(line(x, top, x, 300, w=3))
    b.append(line(480, 300, 720, 300, w=5))
    b.append(line(600, 50, 600, 30, w=4))
    # price tag hanging from the cage
    b.append(line(668, 77, 760, 150, c=INK, w=2.5))
    b.append(f'<g transform="rotate(18 790 170)">{path("M760,150 h70 v46 h-70 l-18,-23 Z", c=INK, w=3, fill=PAPER)}'
             f'{circle(758, 173, 5, c=INK, w=2.5)}{line(778, 165, 818, 165, c=INK, w=2.5)}{line(778, 180, 806, 180, c=INK, w=2.5)}</g>')
    return 'introduction', svg(W, H, ''.join(b), 'An idea in a cage with a price tag')


def what_is_ip():
    b = [ground()]
    # copyright: an open book with an orange bookmark
    x = 300
    b.append(path(f'M{x-90},{GROUND-20} C{x-60},{GROUND-40} {x-20},{GROUND-40} {x},{GROUND-20} '
                  f'C{x+20},{GROUND-40} {x+60},{GROUND-40} {x+90},{GROUND-20} V{GROUND-130} '
                  f'C{x+60},{GROUND-150} {x+20},{GROUND-150} {x},{GROUND-130} C{x-20},{GROUND-150} {x-60},{GROUND-150} {x-90},{GROUND-130} Z',
                  fill=PAPER))
    b.append(line(x, GROUND - 130, x, GROUND - 20))
    for i in range(4):
        y = GROUND - 112 + i * 20
        b.append(line(x - 72, y, x - 18, y - 4, w=2.5) + line(x + 18, y - 4, x + 72, y, w=2.5))
    b.append(path(f'M{x+40},{GROUND-142} v40 l10,-8 l10,8 v-42', c=ORANGE, w=3, fill=PAPER))
    # patent: a gear (an invention)
    x, y, r = 520, GROUND - 85, 55
    pts = []
    for i in range(48):
        a = math.radians(i * 7.5)
        rr = r + (12 if (i // 3) % 2 == 0 else 0)
        pts.append(f'{x+rr*math.cos(a):.1f},{y+rr*math.sin(a):.1f}')
    b.append(f'<polygon points="{" ".join(pts)}" fill="{PAPER}" stroke="{ACC}" stroke-width="4"/>')
    b.append(circle(x, y, 22, c=ORANGE, w=4, fill=PAPER))
    b.append(line(x, GROUND - 18, x, GROUND, w=4))
    # trademark: a rosette badge
    x, y = 740, GROUND - 105
    b.append(path(f'M{x-22},{y+30} L{x-36},{GROUND-6} L{x-14},{GROUND-20} L{x},{GROUND-2} L{x+6},{y+40}', c=ORANGE, w=3, fill=PAPER))
    b.append(path(f'M{x+22},{y+30} L{x+36},{GROUND-6} L{x+14},{GROUND-20} L{x},{GROUND-2}', c=ORANGE, w=3, fill=PAPER))
    pts = []
    for i in range(32):
        a = math.radians(i * 11.25)
        rr = 52 if i % 2 == 0 else 44
        pts.append(f'{x+rr*math.cos(a):.1f},{y+rr*math.sin(a):.1f}')
    b.append(f'<polygon points="{" ".join(pts)}" fill="{PAPER}" stroke="{ACC}" stroke-width="4"/>')
    b.append(circle(x, y, 28, w=3))
    b.append(path(f'M{x-12},{y} l8,10 l16,-20', w=4))
    # trade secret: a safe
    x = 960
    b.append(rect(x - 70, GROUND - 150, 140, 140, rx=8))
    b.append(rect(x - 54, GROUND - 134, 108, 108, w=3, rx=4) if False else rect(x - 54, GROUND - 134, 108, 108, sw=3, rx=4))
    b.append(circle(x, GROUND - 80, 24, c=ORANGE, w=4, fill=PAPER))
    for i in range(8):
        a = math.radians(i * 45)
        b.append(line(x + 16 * math.cos(a), GROUND - 80 + 16 * math.sin(a), x + 22 * math.cos(a), GROUND - 80 + 22 * math.sin(a), c=ORANGE, w=2.5))
    b.append(line(x + 34, GROUND - 100, x + 34, GROUND - 60, w=5))
    b.append(line(x - 56, GROUND - 10, x - 56, GROUND, w=4) + line(x + 56, GROUND - 10, x + 56, GROUND, w=4))
    return 'what-is-ip', svg(W, H, ''.join(b), 'Four kinds of IP: a book, a gear, a badge and a safe')


def why_businesses_care():
    b = [ground()]
    # a maze the business has to navigate
    b.append(path('M420,240 V70 H780 V290 H420', w=4))
    b.append(path('M580,110 H470 V250 H730 V110 H620', w=4))
    b.append(path('M580,210 H520 V150 H680 V210 H620', w=4))
    b.append(path('M380,272 H445 V90 H600 V130 H495 V230 H600 V188', c=ORANGE, w=3, dash='2 9'))
    b.append(bulb(600, 172, 15, sw=3, glow=False))
    b.append(person(365, 74))
    return 'why-businesses-care', svg(W, H, ''.join(b), 'A small figure at the entrance of a maze, with an idea at its center')


def should_we_abolish():
    b = [ground()]
    # balance: many ideas outweigh one padlock
    b.append(path('M560,320 L600,280 L640,320', w=4, fill=PAPER))
    b.append(line(600, 280, 600, 96, w=5))
    b.append(circle(600, 92, 9, w=4, fill=PAPER))
    left, right = (430, 132), (770, 60)
    b.append(line(*left, *right, w=5))
    for (x, y), depth in ((left, 92), (right, 92)):
        b.append(line(x, y, x - 55, y + depth, w=2.5) + line(x, y, x + 55, y + depth, w=2.5))
        b.append(path(f'M{x-70},{y+depth} h140 a70,26 0 0 1 -140,0 Z', w=4, fill=PAPER))
    for i, dx in enumerate((-36, 0, 36)):
        b.append(bulb(430 + dx, 132 + 92 - 30 - (8 if i == 1 else 0), 15, sw=3, glow=False))
    b.append(padlock(770, 60 + 92 - 44, 38))
    return 'should-we-abolish-ip', svg(W, H, ''.join(b), 'A balance where a pan of bulbs outweighs a padlock')


def property_rights():
    b = [ground(40, 1160)]
    xs = [90 + i * 92 for i in range(8)]
    you = 4
    for i, x in enumerate(xs):
        b.append(house(x, 64, 84, ORANGE if i == you else PAPER))
    b.append(tower(1010, 90, 230))
    hx = xs[you] + 32
    b.append(path(f'M1010,130 C810,40 {hx+160},40 {hx},{GROUND-110}', c=INK, w=2.5, dash='3 9'))
    b.append(circle(hx, GROUND - 128, 20, c=INK, w=3, fill=PAPER))
    b.append(path(f'M{hx-8},{GROUND-136} l16,16 M{hx+8},{GROUND-136} l-16,16', c=INK, w=3))
    return 'ip-versus-property-rights', svg(W, H, ''.join(b), 'A distant rights holder vetoes one house in a neighborhood')


def history():
    b = [ground()]
    # royal grant: a scroll under a crown, sealed in orange
    b.append(rect(510, 110, 180, 190, rx=2))
    b.append(path('M500,110 h200 a10,10 0 0 1 0,20 h-200 a10,10 0 0 1 0,-20 Z', fill=PAPER))
    b.append(path('M500,290 h200 a10,10 0 0 1 0,20 h-200 a10,10 0 0 1 0,-20 Z', fill=PAPER))
    for i in range(8):
        b.append(line(536, 150 + i * 16, 664 - (i % 3) * 14, 150 + i * 16, w=2.5))
    b.append(path('M650,276 l-10,34 l14,-8 l8,14 l4,-36', c=ORANGE, w=3, fill=PAPER))
    b.append(circle(658, 268, 18, c=ORANGE, w=4, fill=PAPER))
    b.append(circle(658, 268, 8, c=ORANGE, w=2.5))
    b.append(path('M545,92 L555,48 L578,74 L600,40 L622,74 L645,48 L655,92 Z', c=INK, w=4, fill=PAPER))
    for x, y in ((555, 48), (600, 40), (645, 48)):
        b.append(circle(x, y - 6, 5, c=INK, w=3, fill=PAPER))
    # a quill, resting
    b.append(path('M780,300 C800,220 840,150 900,96 C880,160 850,230 790,296', w=4, fill=PAPER))
    b.append(line(780, 312, 850, 190, w=2.5))
    return 'history', svg(W, H, ''.join(b), 'A royal grant: a scroll under a crown with an orange seal, and a quill')


def contrary_to_free_markets():
    cx, cy, r = 600, 172, 104
    b = [ground()]
    nodes = []
    for i in range(9):
        a = math.radians(-90 + i * 40)
        nodes.append((cx + 175 * math.cos(a), cy + 120 * math.sin(a)))
    for i, (x, y) in enumerate(nodes):
        x2, y2 = nodes[(i + 1) % len(nodes)]
        if i == 2:
            b.append(line(x, y, x2, y2, c=INK, w=2.5, dash='4 8'))
        else:
            b.append(line(x, y, x2, y2, w=2.5))
        b.append(line(x, y, cx + r * 0.95 * math.cos(math.atan2(y - cy, x - cx)),
                      cy + r * 0.95 * math.sin(math.atan2(y - cy, x - cx)), w=2, dash='2 7'))
    b.append(circle(cx, cy, r, fill=PAPER))
    b.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*0.32:.0f}" stroke="{ACC}" stroke-width="3"/>')
    b.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{r*0.45:.0f}" ry="{r}" stroke="{ACC}" stroke-width="3"/>')
    b.append(line(cx, cy - r, cx, cy + r, w=3))
    for i, (x, y) in enumerate(nodes):
        b.append(circle(x, y, 12, c=ORANGE if i == 6 else ACC, w=4, fill=PAPER))
    mx, my = [(nodes[2][k] + nodes[3][k]) / 2 for k in (0, 1)]
    b.append(padlock(mx, my - 14, 30))
    return 'contrary-to-free-markets', svg(W, H, ''.join(b), 'A globe ringed by a network, with one link padlocked')


def why_ip_persists():
    b = [ground()]
    stacks = [(400, 9), (500, 14), (610, 18), (720, 12), (820, 7)]
    for x, n in stacks:
        for i in range(n):
            y = GROUND - 12 - i * 12
            off = (i % 3 - 1) * 4
            b.append(rect(x - 44 + off, y, 88, 12, sw=3))
    top = GROUND - 12 - 17 * 12
    # the rubber stamp, just pressed onto the tallest stack
    b.append(path(f'M592,{top-28} h36', c=ORANGE, w=5))
    b.append(rect(574, top - 70, 72, 34, c=INK, sw=4, rx=4))
    b.append(rect(596, top - 118, 28, 48, c=INK, sw=4, rx=4))
    b.append(circle(610, top - 132, 18, c=INK, w=4, fill=PAPER))
    return 'why-ip-persists', svg(W, H, ''.join(b), 'Stacks of paperwork and a rubber stamp')


def innovation_and_freedom():
    b = [ground()]
    # a sprout growing out of a broken-open padlock
    b.append(path('M600,240 C598,200 604,150 600,96', w=4))
    b.append(path('M600,196 C560,190 540,160 546,136 C580,140 600,166 600,196 Z', fill=PAPER))
    b.append(path('M601,150 C640,146 664,118 660,92 C626,96 604,120 601,150 Z', fill=PAPER))
    b.append(circle(600, 84, 14, c=ORANGE, w=4, fill=PAPER))
    b.append(rays(600, 84, 26, 40, 210, 330, 5, w=3))
    b.append(padlock(600, GROUND - 80, 100, c=INK, opened=True))
    return 'innovation-and-freedom', svg(W, H, ''.join(b), 'A sprout growing out of a broken-open padlock')


def what_should_you_do():
    cx, cy, r = 600, 172, 112
    b = [ground(), path(f'M{cx+150},{GROUND} C900,300 960,260 1080,250', c=ORANGE, w=3, dash='2 9')]
    b.append(circle(cx, cy, r, fill=PAPER))
    b.append(circle(cx, cy, r - 16, w=2.5))
    for i in range(36):
        a = math.radians(i * 10)
        l = 12 if i % 9 == 0 else 6
        b.append(line(cx + (r - 18) * math.cos(a), cy + (r - 18) * math.sin(a),
                      cx + (r - 18 - l) * math.cos(a), cy + (r - 18 - l) * math.sin(a), w=2.5))
    star = []
    for i in range(8):
        a = math.radians(-90 + i * 45)
        rr = 70 if i % 2 == 0 else 22
        star.append(f'{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}')
    b.append(f'<polygon points="{" ".join(star)}" fill="{PAPER}" stroke="{ACC}" stroke-width="3"/>')
    a = math.radians(-40)
    b.append(path(f'M{cx+78*math.cos(a):.1f},{cy+78*math.sin(a):.1f} L{cx+10*math.cos(a+1.57):.1f},{cy+10*math.sin(a+1.57):.1f} '
                  f'L{cx-40*math.cos(a):.1f},{cy-40*math.sin(a):.1f} L{cx-10*math.cos(a+1.57):.1f},{cy-10*math.sin(a+1.57):.1f} Z',
                  c=ORANGE, w=4, fill=PAPER))
    b.append(circle(cx, cy, 6, c=ORANGE, w=4, fill=PAPER))
    b.append(circle(cx, cy - r - 10, 10, w=4, fill=PAPER))
    return 'what-should-you-do', svg(W, H, ''.join(b), 'A compass with an orange needle, and a path leading off')


def ip_contrarianism():
    b = [ground()]
    xs = [250 + i * 120 for i in range(7)]
    opened = 3
    for i, x in enumerate(xs):
        if i == opened:
            b.append(path(f'M{x-40},{GROUND} L{x-90},{GROUND+28} H{x+90} L{x+40},{GROUND} Z', c=None, w=0, fill=SOFT).replace('stroke="None"', ''))
            b.append(rect(x - 40, GROUND - 160, 80, 160, c=ACC, sw=4, fill=SOFT))
            b.append(bulb(x, GROUND - 92, 20, sw=3, glow=False))
            b.append(path(f'M{x+40},{GROUND-160} L{x+76},{GROUND-146} V{GROUND+12} L{x+40},{GROUND}', w=4, fill=PAPER))
        else:
            b.append(rect(x - 40, GROUND - 160, 80, 160, sw=4))
            b.append(rect(x - 28, GROUND - 146, 56, 50, sw=2.5, fill='none'))
            b.append(padlock(x + 22, GROUND - 82, 18, sw=2.5))
    return 'ip-contrarianism', svg(W, H, ''.join(b), 'A row of locked doors with one standing open and lit')


def publishing():
    b = [ground()]
    x = 470
    b.append(path(f'M{x-110},{GROUND-6} C{x-70},{GROUND-30} {x-24},{GROUND-30} {x},{GROUND-6} '
                  f'C{x+24},{GROUND-30} {x+70},{GROUND-30} {x+110},{GROUND-6} V{GROUND-100} '
                  f'C{x+70},{GROUND-124} {x+24},{GROUND-124} {x},{GROUND-100} C{x-24},{GROUND-124} {x-70},{GROUND-124} {x-110},{GROUND-100} Z',
                  fill=PAPER))
    b.append(line(x, GROUND - 100, x, GROUND - 6))
    b.append(path(f'M{x-60},{GROUND-116} v40 l10,-8 l10,8 v-44', c=ORANGE, w=3, fill=PAPER))
    # a page lifting off, then copies flying away
    b.append(path(f'M{x},{GROUND-100} C{x+30},{GROUND-160} {x+80},{GROUND-170} {x+120},{GROUND-150}', w=3, dash='2 8'))
    for (px, py, rot, s) in ((600, 140, -14, 1.0), (700, 92, 10, 0.9), (800, 120, -6, 0.8),
                             (880, 64, 16, 0.7), (960, 108, -12, 0.6), (1030, 70, 8, 0.5)):
        b.append(doc(px, py, 70 * s, 90 * s, rot, sw=3))
    return 'publishing-and-copyright', svg(W, H, ''.join(b), 'An open book whose pages fly off as copies')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'hero.svg').write_text(hero(), encoding='utf-8')
    count = 1
    for fn in (introduction, what_is_ip, why_businesses_care, should_we_abolish, property_rights, history,
               contrary_to_free_markets, why_ip_persists, innovation_and_freedom, what_should_you_do,
               ip_contrarianism, publishing):
        slug, content = fn()
        (OUT / f'{slug}.svg').write_text(content, encoding='utf-8')
        count += 1
    print(f'wrote {count} illustrations to {OUT}')


if __name__ == '__main__':
    main()
