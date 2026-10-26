#!/usr/bin/env python3
"""Erzeugt die Platzhalter-Illustrationen unter assets/img/.

Es handelt sich bewusst um gezeichnete Illustrationen, nicht um Fotos:
Fotolizenzen liegen nicht vor. Für den Livebetrieb durch lizenzierte
Immobilienfotos ersetzen (gleiche Dateinamen bzw. Pfade in den Demo-Seiten anpassen).
"""
import os, random

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img")
os.makedirs(OUT, exist_ok=True)


def svg(name, w, h, body, defs=""):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration">'
            f"<defs>{defs}</defs>{body}</svg>"
        )


def grad(id_, stops, x2=0, y2=1):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def tree(x, y, r, c1="#5d7a4f", c2="#486339"):
    return (
        f'<rect x="{x-5}" y="{y}" width="10" height="{r*0.9}" fill="#5a4332"/>'
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c1}"/>'
        f'<circle cx="{x-r*0.4}" cy="{y+r*0.3}" r="{r*0.7}" fill="{c2}"/>'
        f'<circle cx="{x+r*0.45}" cy="{y+r*0.2}" r="{r*0.65}" fill="{c1}"/>'
    )


def win(x, y, w, h, fill="#bcd3dd", frame="#f6f1e7"):
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{frame}"/>'
        f'<rect x="{x+4}" y="{y+4}" width="{w-8}" height="{h-8}" fill="{fill}"/>'
        f'<rect x="{x+w/2-1.5}" y="{y+4}" width="3" height="{h-8}" fill="{frame}"/>'
        f'<rect x="{x+4}" y="{y+h/2-1.5}" width="{w-8}" height="3" fill="{frame}"/>'
    )


# 1 — klassisches Stadthaus, warmes Licht --------------------------------
def house_classic():
    W, H = 1600, 1000
    d = grad("s", [(0, "#f4e3cf"), (0.6, "#fbf3e6"), (1, "#fffaf2")]) + grad(
        "g", [(0, "#8fa36f"), (1, "#6f8556")]
    )
    b = f'<rect width="{W}" height="{H}" fill="url(#s)"/>'
    b += '<circle cx="1250" cy="200" r="120" fill="#fff4d6" opacity=".7"/>'
    b += f'<rect y="760" width="{W}" height="240" fill="url(#g)"/>'
    b += '<path d="M640 1000 L760 760 H840 L960 1000Z" fill="#e6d8bf"/>'
    # Haus
    b += '<rect x="420" y="400" width="760" height="380" fill="#efe3cf"/>'
    b += '<path d="M380 410 L800 230 L1220 410Z" fill="#7b5a43"/>'
    b += '<rect x="380" y="405" width="840" height="22" fill="#d9c7a8"/>'
    b += '<rect x="1020" y="240" width="60" height="120" fill="#cdb996"/>'
    for x in (480, 620, 900, 1040):
        b += win(x, 470, 80, 130)
        b += win(x, 640, 80, 100) if x in (480, 1040) else ""
    b += '<rect x="740" y="590" width="120" height="190" rx="4" fill="#2c3e50"/>'
    b += '<circle cx="838" cy="690" r="5" fill="#c5a16a"/>'
    b += '<rect x="700" y="570" width="200" height="14" fill="#d9c7a8"/>'
    for x in (708, 884):
        b += f'<rect x="{x}" y="584" width="8" height="196" fill="#f6f1e7"/>'
    b += tree(300, 640, 90) + tree(1330, 620, 100, "#6b8a58", "#4d6a3f")
    b += '<rect x="0" y="780" width="1600" height="8" fill="#5f7548" opacity=".5"/>'
    for i in range(10):
        b += f'<circle cx="{120+i*150}" cy="{800+(i%3)*30}" r="16" fill="#d58a8a" opacity=".85"/>'
    svg("house-classic.svg", W, H, b, d)


# 2 — Skyline bei Nacht ---------------------------------------------------
def skyline():
    W, H = 1600, 1000
    rnd = random.Random(7)
    d = grad("s", [(0, "#0a1b2d"), (0.7, "#183a5a"), (1, "#27506f")])
    b = f'<rect width="{W}" height="{H}" fill="url(#s)"/>'
    b += '<circle cx="1280" cy="170" r="55" fill="#f3ead2"/><circle cx="1300" cy="160" r="52" fill="#13304a"/>'
    for i in range(70):
        b += f'<circle cx="{rnd.randint(0,W)}" cy="{rnd.randint(0,400)}" r="{rnd.choice([1,1.5,2])}" fill="#fff" opacity=".6"/>'
    x = -20
    while x < W:
        bw = rnd.randint(110, 220)
        bh = rnd.randint(300, 760)
        col = rnd.choice(["#0e2438", "#12304a", "#0b1c2e"])
        b += f'<rect x="{x}" y="{H-bh}" width="{bw}" height="{bh}" fill="{col}"/>'
        for wy in range(H - bh + 24, H - 30, 34):
            for wx in range(x + 16, x + bw - 20, 28):
                if rnd.random() < 0.42:
                    b += f'<rect x="{wx}" y="{wy}" width="14" height="18" fill="{rnd.choice(["#f2c97a","#ffe3a3","#c5a16a"])}" opacity=".9"/>'
        x += bw + rnd.randint(-10, 14)
    b += f'<rect y="930" width="{W}" height="70" fill="#07131f"/>'
    svg("skyline-night.svg", W, H, b, d)


# 3 — Maklerporträt (Illustration) -----------------------------------------
def portrait():
    W, H = 900, 1100
    d = grad("s", [(0, "#f3e4d0"), (1, "#e3c9a6")])
    b = f'<rect width="{W}" height="{H}" fill="url(#s)"/>'
    b += '<rect x="560" y="120" width="260" height="420" fill="#fff" opacity=".25"/>'
    # Körper / Blazer
    b += '<path d="M120 1100 C140 800 260 720 450 720 C640 720 760 800 780 1100Z" fill="#3b4a5c"/>'
    b += '<path d="M450 735 L350 1100 H550Z" fill="#f4efe6"/>'
    b += '<path d="M450 735 L395 800 L450 880 L505 800Z" fill="#e8ddc9"/>'
    # Hals, Kopf
    b += '<rect x="400" y="620" width="100" height="130" rx="40" fill="#e0b48f"/>'
    b += '<ellipse cx="450" cy="480" rx="125" ry="150" fill="#ebc3a0"/>'
    # Haare
    b += '<path d="M320 470 C300 270 430 220 520 250 C600 280 600 400 585 480 C560 380 470 340 380 360 C350 380 335 420 320 470Z" fill="#6b4630"/>'
    b += '<path d="M320 470 C300 600 330 690 350 720 C330 600 345 520 345 470Z" fill="#6b4630"/>'
    b += '<path d="M585 480 C610 600 590 690 565 720 C585 600 575 540 570 480Z" fill="#6b4630"/>'
    # Gesicht
    b += '<ellipse cx="402" cy="490" rx="9" ry="6" fill="#3a2a22"/><ellipse cx="498" cy="490" rx="9" ry="6" fill="#3a2a22"/>'
    b += '<path d="M410 560 Q450 595 490 560" stroke="#a65d5d" stroke-width="7" fill="none" stroke-linecap="round"/>'
    b += '<path d="M380 465 Q402 452 424 465 M476 465 Q498 452 520 465" stroke="#5a3a28" stroke-width="5" fill="none" stroke-linecap="round"/>'
    # Mappe
    b += '<rect x="560" y="860" width="210" height="260" rx="8" fill="#1d2b3a" transform="rotate(8 660 990)"/>'
    svg("portrait.svg", W, H, b, d)


# 4 — Haus am Wasser --------------------------------------------------------
def lake_house():
    W, H = 1600, 1000
    d = grad("s", [(0, "#bfdcee"), (1, "#eaf4f7")]) + grad(
        "w", [(0, "#7fb6cc"), (1, "#4f8fab")]
    )
    b = f'<rect width="{W}" height="{H}" fill="url(#s)"/>'
    b += '<path d="M0 520 L260 330 L430 460 L660 280 L900 470 L1150 340 L1400 470 L1600 400 V560 H0Z" fill="#9db8c6" opacity=".8"/>'
    b += '<path d="M0 560 L200 450 L420 560Z M900 560 L1120 440 L1400 560Z" fill="#6f95a6" opacity=".6"/>'
    b += f'<rect y="560" width="{W}" height="440" fill="url(#w)"/>'
    for i in range(14):
        b += f'<rect x="{80+i*110}" y="{600+(i%5)*55}" width="{70+(i%3)*30}" height="4" rx="2" fill="#fff" opacity=".35"/>'
    b += '<path d="M0 640 Q400 600 800 650 T1600 630 V1000 H0Z" fill="#cdbb95"/>'
    b += '<path d="M0 700 Q500 660 900 720 T1600 700 V1000 H0Z" fill="#d8c8a4"/>'
    # Haus
    b += '<rect x="520" y="400" width="520" height="260" fill="#f6f1e7"/>'
    b += '<path d="M490 410 L780 250 L1070 410Z" fill="#37576b"/>'
    b += '<rect x="520" y="400" width="520" height="14" fill="#d9d0bd"/>'
    for x in (560, 700, 860, 960):
        b += win(x, 450, 60, 90)
    b += '<rect x="740" y="520" width="80" height="140" fill="#8a6a4f"/>'
    b += '<rect x="480" y="660" width="600" height="14" fill="#8a6a4f"/>'
    # Steg
    b += '<rect x="1100" y="690" width="420" height="16" fill="#8a6a4f"/>'
    for x in range(1120, 1520, 60):
        b += f'<rect x="{x}" y="706" width="8" height="60" fill="#6e533d"/>'
    b += tree(380, 560, 80, "#5f8a5a", "#436e44") + tree(1180, 540, 90, "#68905f", "#4a7448")
    svg("lake-house.svg", W, H, b, d)


# 5 — Moderne Villa (Architektur, Dämmerung) ---------------------------------
def villa():
    W, H = 1600, 1000
    d = grad("s", [(0, "#1a2433"), (0.65, "#3b4a5f"), (1, "#8d8a8c")]) + grad(
        "p", [(0, "#4d7e95"), (1, "#1f3f55")]
    )
    b = f'<rect width="{W}" height="{H}" fill="url(#s)"/>'
    b += '<rect y="740" width="1600" height="260" fill="#1b2128"/>'
    b += '<rect x="120" y="780" width="760" height="150" fill="url(#p)"/>'
    b += '<rect x="120" y="780" width="760" height="8" fill="#c9d4da" opacity=".6"/>'
    # Baukörper
    b += '<rect x="300" y="500" width="1000" height="240" fill="#e9e6e0"/>'
    b += '<rect x="240" y="470" width="760" height="40" fill="#20262d"/>'
    b += '<rect x="860" y="300" width="460" height="200" fill="#2a323b"/>'
    b += '<rect x="820" y="280" width="540" height="30" fill="#14181d"/>'
    b += '<rect x="340" y="530" width="520" height="190" fill="#f0c97c" opacity=".92"/>'
    for x in range(340, 860, 104):
        b += f'<rect x="{x-2}" y="530" width="5" height="190" fill="#20262d"/>'
    b += '<rect x="900" y="330" width="380" height="140" fill="#f4d58e" opacity=".9"/>'
    for x in range(900, 1280, 95):
        b += f'<rect x="{x-2}" y="330" width="5" height="140" fill="#14181d"/>'
    b += '<rect x="960" y="540" width="300" height="200" fill="#8d6e55"/>'
    for x in range(970, 1260, 24):
        b += f'<rect x="{x}" y="540" width="4" height="200" fill="#6f553f"/>'
    b += '<path d="M120 800 H880" stroke="#f0c97c" stroke-width="3" opacity=".5"/>'
    b += '<ellipse cx="500" cy="860" rx="250" ry="22" fill="#f0c97c" opacity=".12"/>'
    b += tree(1430, 640, 70, "#2f4a3b", "#223829")
    svg("villa.svg", W, H, b, d)


# 6 — Wohnzimmer ----------------------------------------------------------------
def interior():
    W, H = 1400, 1000
    d = grad("w", [(0, "#f6ecdc"), (1, "#ecdcc2")])
    b = f'<rect width="{W}" height="{H}" fill="url(#w)"/>'
    b += '<rect y="760" width="1400" height="240" fill="#b58f68"/>'
    for y in range(780, 1000, 40):
        b += f'<rect y="{y}" width="1400" height="2" fill="#a07b56" opacity=".6"/>'
    b += '<rect x="780" y="130" width="460" height="560" fill="#fffaf0"/><rect x="800" y="150" width="420" height="520" fill="#d5e7ef"/>'
    b += '<rect x="1008" y="150" width="6" height="520" fill="#fffaf0"/>'
    b += '<path d="M800 520 L1000 360 L1220 520 V670 H800Z" fill="#9dbf9a" opacity=".6"/>'
    # Sofa
    b += '<rect x="140" y="560" width="620" height="200" rx="40" fill="#8c7b68"/>'
    b += '<rect x="100" y="590" width="90" height="190" rx="36" fill="#7a6a58"/><rect x="710" y="590" width="90" height="190" rx="36" fill="#7a6a58"/>'
    b += '<rect x="190" y="520" width="520" height="110" rx="34" fill="#9a8873"/>'
    b += '<rect x="230" y="560" width="110" height="90" rx="22" fill="#c5a16a"/><rect x="560" y="560" width="110" height="90" rx="22" fill="#102b46"/>'
    # Tisch, Lampe, Pflanze
    b += '<ellipse cx="520" cy="860" rx="190" ry="34" fill="#3d2f24"/><rect x="505" y="800" width="30" height="60" fill="#3d2f24"/>'
    b += '<rect x="930" y="700" width="14" height="190" fill="#2a2a2a"/><path d="M880 700 L994 700 L970 600 L904 600Z" fill="#f4e2b6"/>'
    b += '<rect x="1230" y="720" width="70" height="110" rx="12" fill="#c9b79a"/>'
    for a in (-30, 0, 30, -60, 60):
        b += f'<ellipse cx="1265" cy="640" rx="22" ry="90" fill="#5f8a5a" transform="rotate({a} 1265 720)"/>'
    b += '<rect x="170" y="200" width="320" height="220" fill="#fffaf0" stroke="#c5a16a" stroke-width="8"/><path d="M190 400 L300 290 L360 350 L420 270 L470 400Z" fill="#7a9bb0"/>'
    svg("interior.svg", W, H, b, d)


# 7 — Mehrfamilienhaus ------------------------------------------------------------
def apartments():
    W, H = 1600, 1000
    d = grad("s", [(0, "#9cc4df"), (1, "#e6f0f5")])
    b = f'<rect width="{W}" height="{H}" fill="url(#s)"/>'
    b += '<ellipse cx="300" cy="180" rx="140" ry="36" fill="#fff" opacity=".8"/><ellipse cx="1200" cy="120" rx="180" ry="40" fill="#fff" opacity=".7"/>'
    b += '<rect y="820" width="1600" height="180" fill="#6f7d63"/>'
    b += '<rect x="260" y="270" width="1080" height="560" fill="#e8d9c2"/>'
    b += '<rect x="260" y="250" width="1080" height="30" fill="#8e6f58"/>'
    b += '<rect x="260" y="700" width="1080" height="130" fill="#cdb998"/>'
    for r in range(3):
        for c in range(6):
            x, y = 310 + c * 170, 310 + r * 130
            b += win(x, y, 90, 100, "#c4d9e3")
            b += f'<rect x="{x-14}" y="{y+88}" width="118" height="10" fill="#6c5846"/>'
            b += f'<rect x="{x-14}" y="{y+60}" width="118" height="3" fill="#6c5846"/>'
    for c in range(6):
        b += win(310 + c * 170, 720, 90, 90, "#c4d9e3") if c != 2 else '<rect x="650" y="715" width="110" height="115" fill="#2c3e50"/>'
    b += tree(150, 700, 95) + tree(1470, 690, 100, "#6b8a58", "#4d6a3f")
    b += '<rect x="0" y="880" width="1600" height="120" fill="#4f5963"/><rect x="0" y="935" width="1600" height="6" fill="#e9e4d4" opacity=".7"/>'
    svg("apartments.svg", W, H, b, d)


# 8 — Wohnhaus mit Garten (Regional) ----------------------------------------------
def regional():
    W, H = 1600, 1000
    d = grad("s", [(0, "#cfe6ee"), (1, "#f3f8f0")])
    b = f'<rect width="{W}" height="{H}" fill="url(#s)"/>'
    b += '<path d="M0 560 Q300 440 600 540 T1200 520 T1600 560 V1000 H0Z" fill="#a9c58c"/>'
    b += '<path d="M0 650 Q400 560 900 650 T1600 640 V1000 H0Z" fill="#8fb272"/>'
    b += '<rect x="430" y="470" width="360" height="230" fill="#e9d7b8"/><path d="M400 480 L610 330 L820 480Z" fill="#b2573c"/>'
    b += '<rect x="950" y="500" width="260" height="190" fill="#f3ece0"/><path d="M930 510 L1080 400 L1230 510Z" fill="#8c4a37"/>'
    for x in (470, 690):
        b += win(x, 520, 64, 100)
    b += win(990, 540, 56, 80) + win(1110, 540, 56, 80)
    b += '<rect x="580" y="590" width="60" height="110" fill="#6f4e37"/>'
    b += '<rect x="410" y="700" width="820" height="10" fill="#7a6a58" opacity=".5"/>'
    b += tree(260, 640, 85, "#5e8a4f", "#476f3a") + tree(1330, 620, 95, "#6e9658", "#4f773f") + tree(880, 660, 55, "#4f7a47", "#3c6038")
    for i in range(12):
        b += f'<circle cx="{150+i*125}" cy="{860+(i%4)*25}" r="12" fill="{["#e7b3b3","#f3d27a","#fff"][i%3]}" opacity=".9"/>'
    svg("regional.svg", W, H, b, d)


if __name__ == "__main__":
    house_classic(); skyline(); portrait(); lake_house(); villa(); interior(); apartments(); regional()
    print("OK:", sorted(os.listdir(OUT)))
