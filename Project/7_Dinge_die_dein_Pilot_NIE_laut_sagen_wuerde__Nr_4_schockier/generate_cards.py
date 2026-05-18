# -*- coding: utf-8 -*-
"""
Generates transparent 1920x1080 card PNGs for pilot-secrets-de.
Only the bottom panel has colour -- everything else is fully transparent
so the background video shows through.
"""
from PIL import Image, ImageDraw, ImageFont
import json, os, textwrap

TOTAL_DURATION = 149.88

SCENES = [
    {"id": 1,  "label": "HOOK",  "words": 22, "badge": None, "headline": "Dein Pilot weiss, dass ein Teil defekt ist", "sub": "-- und fliegt trotzdem."},
    {"id": 2,  "label": "#1",   "words": 31, "badge": "01", "headline": "Minimum Equipment List",                     "sub": "Bis zu 70 defekte Teile sind erlaubt."},
    {"id": 3,  "label": "#2",   "words": 30, "badge": "02", "headline": "Etwas holprig",                              "sub": "Pilot hat selbst Angst -- sagt es nicht."},
    {"id": 4,  "label": "#3",   "words": 27, "badge": "03", "headline": "Nur 7 Minuten manuelle Steuerung",           "sub": "Den Rest schlaeft der Pilot ein."},
    {"id": 5,  "label": "#4",   "words": 34, "badge": "04", "headline": "Verschiedene Gerichte + O2-Maske",           "sub": "Vergiftungsschutz. Nur 12 Min Sauerstoff."},
    {"id": 6,  "label": "#5",   "words": 29, "badge": "05", "headline": "Geheime Schlafkabinen",                      "sub": "Dein Pilot liegt im Bett."},
    {"id": 7,  "label": "#6",   "words": 33, "badge": "06", "headline": "Einmal pro Jahr Blitzeinschlag",             "sub": "Schweigen ist Methode."},
    {"id": 8,  "label": "#7",   "words": 36, "badge": "07", "headline": "Die toedlichen 11 Minuten",                  "sub": "Die meisten Unfaelle -- beim Landen."},
    {"id": 9,  "label": "OUTRO","words": 33, "badge": None, "headline": "7 Geheimnisse fliegen taeglich mit dir",     "sub": "Die Frage: Wie viele mehr gibt es noch?"},
    {"id": 10, "label": "CTA",  "words": 32, "badge": None, "headline": "Abonniere diesen Kanal",                     "sub": "Welcher Fakt hat dich am meisten ueberrascht?"},
]

W, H        = 1920, 1080
PANEL_H     = 250
PANEL_ALPHA = 210
ACCENT      = (255, 180, 0, 255)
TEXT_WHITE  = (255, 255, 255, 255)
TEXT_MUTED  = (180, 190, 210, 255)
PANEL_COLOR = (8, 10, 18, PANEL_ALPHA)


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


def draw_card(scene, out_path):
    # Fully transparent canvas -- video shows through everywhere except the panel
    img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    panel_top = H - PANEL_H

    # Semi-transparent dark bottom panel
    panel = Image.new("RGBA", (W, PANEL_H), PANEL_COLOR)
    img.alpha_composite(panel, (0, panel_top))

    # Amber accent line at top of panel
    draw.rectangle([(0, panel_top), (W, panel_top + 5)], fill=ACCENT)

    # Badge circle on the left
    if scene["badge"]:
        cx = 110
        cy = panel_top + PANEL_H // 2
        r  = 56
        draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=ACCENT)
        f_b = load_font(44, bold=True)
        draw.text((cx, cy), scene["badge"], font=f_b, fill=(8, 10, 18, 255), anchor="mm")
        text_x = cx + r + 44
    else:
        f_lbl = load_font(28)
        draw.text((80, panel_top + 18), scene["label"], font=f_lbl, fill=ACCENT)
        text_x = 80

    # Headline
    f_h     = load_font(60, bold=True)
    wrapped = textwrap.fill(scene["headline"], width=40)
    hy      = panel_top + 30 if not scene["badge"] else panel_top + 18
    draw.text((text_x, hy), wrapped, font=f_h, fill=TEXT_WHITE)

    # Sub-line
    f_s   = load_font(36)
    lines = wrapped.count("\n") + 1
    bbox  = draw.textbbox((0, 0), "Ag", font=f_h)
    sub_y = hy + (bbox[3] - bbox[1]) * lines + 14
    draw.text((text_x, sub_y), scene["sub"], font=f_s, fill=TEXT_MUTED)

    # Save with alpha channel preserved
    img.save(out_path, "PNG")
    print("  card -> " + out_path)


def build_timing():
    total_words = sum(s["words"] for s in SCENES)
    t, timing = 0.0, []
    for s in SCENES:
        dur = round(s["words"] / total_words * TOTAL_DURATION, 3)
        timing.append({
            "scene_id": s["id"], "label": s["label"],
            "start": round(t, 3), "duration": dur, "end": round(t + dur, 3),
            "card_png": "cards/scene_{:02d}.png".format(s["id"]),
        })
        t += dur
    return timing


if __name__ == "__main__":
    base    = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(base, "cards")
    os.makedirs(out_dir, exist_ok=True)

    print("Generating transparent cards...")
    for s in SCENES:
        draw_card(s, os.path.join(out_dir, "scene_{:02d}.png".format(s["id"])))

    timing = build_timing()
    with open(os.path.join(base, "timing.json"), "w", encoding="utf-8") as f:
        json.dump(timing, f, indent=2, ensure_ascii=False)

    print("\ntiming.json saved:")
    for t in timing:
        print("  Scene {:2d} [{:5s}]  {:6.2f}s -> {:6.2f}s".format(
            t["scene_id"], t["label"], t["start"], t["end"]))
