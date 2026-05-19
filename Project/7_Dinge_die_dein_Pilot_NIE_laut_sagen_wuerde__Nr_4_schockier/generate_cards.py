# -*- coding: utf-8 -*-
"""
Generates glassmorphism info-card PNGs for each scene.
Cards appear bottom-left, styled like the reference powerbank video:
  - Dark semi-transparent background, rounded corners
  - Amber left accent bar + amber badge label
  - Large white stat (or description) below the badge
"""
from PIL import Image, ImageDraw, ImageFont
import json, os

TOTAL_DURATION = 149.88
W, H = 1280, 720   # match source video resolution

# Card geometry (tuned to 1280x720)
CARD_X      = 15
CARD_Y      = 460   # sits above caption zone
CARD_W      = 200
CARD_H      = 82
CARD_RADIUS = 7
ACCENT_W    = 4     # amber left bar width

# Colors
BG          = (8, 10, 20, 215)       # dark navy, semi-transparent
AMBER       = (255, 180, 0, 255)
WHITE       = (255, 255, 255, 255)
MUTED       = (180, 190, 210, 220)

SCENES = [
    {"id": 1,  "words": 22, "badge": "PILOT",   "stat": "",        "desc": "Defekt — fliegt trotzdem"},
    {"id": 2,  "words": 31, "badge": "#01",      "stat": "70+",     "desc": "Defekte Teile erlaubt"},
    {"id": 3,  "words": 30, "badge": "#02",      "stat": "",        "desc": "Etwas holprig"},
    {"id": 4,  "words": 27, "badge": "#03",      "stat": "7 MIN.",  "desc": "Manuelle Steuerung"},
    {"id": 5,  "words": 34, "badge": "#04",      "stat": "12 MIN.", "desc": "Sauerstoff"},
    {"id": 6,  "words": 29, "badge": "#05",      "stat": "",        "desc": "Geheime Schlafkabine"},
    {"id": 7,  "words": 33, "badge": "#06",      "stat": "1x/Jahr", "desc": "Blitzeinschlag"},
    {"id": 8,  "words": 36, "badge": "#07",      "stat": "11 MIN.", "desc": "Toedlichste Phase"},
    {"id": 9,  "words": 33, "badge": "OUTRO",    "stat": "",        "desc": "7 Geheimnisse"},
    {"id": 10, "words": 32, "badge": "#CTA",     "stat": "",        "desc": "Abonniere & Kommentiere"},
]


def load_font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def draw_rounded_rect(draw, xy, radius, fill):
    x1, y1, x2, y2 = xy
    draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill)
    draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill)
    draw.ellipse([x1, y1, x1 + 2*radius, y1 + 2*radius], fill=fill)
    draw.ellipse([x2 - 2*radius, y1, x2, y1 + 2*radius], fill=fill)
    draw.ellipse([x1, y2 - 2*radius, x1 + 2*radius, y2], fill=fill)
    draw.ellipse([x2 - 2*radius, y2 - 2*radius, x2, y2], fill=fill)


def draw_card(scene, out_path):
    img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx1 = CARD_X
    cy1 = CARD_Y
    cx2 = CARD_X + CARD_W
    cy2 = CARD_Y + CARD_H

    # Glass background
    draw_rounded_rect(draw, (cx1, cy1, cx2, cy2), CARD_RADIUS, BG)

    # Amber left accent bar
    draw.rectangle(
        [cx1, cy1 + CARD_RADIUS, cx1 + ACCENT_W, cy2 - CARD_RADIUS],
        fill=AMBER
    )

    text_x = cx1 + ACCENT_W + 8

    # Badge label (amber, small)
    f_badge = load_font(14, bold=True)
    draw.text((text_x, cy1 + 10), scene["badge"], font=f_badge, fill=AMBER)

    # Stat (large, white) OR description (medium, white)
    if scene["stat"]:
        f_stat = load_font(36, bold=True)
        draw.text((text_x, cy1 + 28), scene["stat"], font=f_stat, fill=WHITE)
        # description below stat (muted, very small)
        if scene["desc"]:
            f_desc = load_font(11)
            draw.text((text_x, cy2 - 18), scene["desc"], font=f_desc, fill=MUTED)
    else:
        # No stat — show description in medium text
        f_desc = load_font(16, bold=True)
        draw.text((text_x, cy1 + 30), scene["desc"], font=f_desc, fill=WHITE)

    img.save(out_path, "PNG")
    print("  card -> " + out_path)


def build_timing():
    total_words = sum(s["words"] for s in SCENES)
    t, timing = 0.0, []
    for s in SCENES:
        dur = round(s["words"] / total_words * TOTAL_DURATION, 3)
        timing.append({
            "scene_id":  s["id"],
            "label":     s["badge"],
            "start":     round(t, 3),
            "duration":  dur,
            "end":       round(t + dur, 3),
            "card_png":  "cards/scene_{:02d}.png".format(s["id"]),
        })
        t += dur
    return timing


if __name__ == "__main__":
    base    = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(base, "cards")
    os.makedirs(out_dir, exist_ok=True)

    print("Generating glassmorphism cards...")
    for s in SCENES:
        draw_card(s, os.path.join(out_dir, "scene_{:02d}.png".format(s["id"])))

    timing = build_timing()
    with open(os.path.join(base, "timing.json"), "w", encoding="utf-8") as f:
        json.dump(timing, f, indent=2, ensure_ascii=False)

    print("\ntiming.json saved:")
    for t in timing:
        print("  Scene {:2d} [{:5s}]  {:6.2f}s -> {:6.2f}s".format(
            t["scene_id"], t["label"], t["start"], t["end"]))
