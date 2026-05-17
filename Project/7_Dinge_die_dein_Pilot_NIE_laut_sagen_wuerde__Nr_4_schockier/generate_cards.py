# -*- coding: utf-8 -*-
"""
Generates 1920x1080 card PNGs for pilot-secrets-de.
Run once in the cloud -- output PNGs committed to GitHub.
"""
from PIL import Image, ImageDraw, ImageFont
import json, os, textwrap

TOTAL_DURATION = 149.88  # seconds

SCENES = [
    {
        "id": 1, "label": "HOOK", "words": 22,
        "badge": None,
        "headline": "Dein Pilot weiss, dass ein Teil defekt ist",
        "sub": "-- und fliegt trotzdem.",
    },
    {
        "id": 2, "label": "#1", "words": 31,
        "badge": "01",
        "headline": "Minimum Equipment List",
        "sub": "Bis zu 70 defekte Teile sind erlaubt.",
    },
    {
        "id": 3, "label": "#2", "words": 30,
        "badge": "02",
        "headline": "Etwas holprig",
        "sub": "Pilot hat selbst Angst -- sagt es nicht.",
    },
    {
        "id": 4, "label": "#3", "words": 27,
        "badge": "03",
        "headline": "Nur 7 Minuten manuelle Steuerung",
        "sub": "Den Rest schlaeft der Pilot ein.",
    },
    {
        "id": 5, "label": "#4", "words": 34,
        "badge": "04",
        "headline": "Verschiedene Gerichte + O2-Maske",
        "sub": "Vergiftungsschutz. Nur 12 Min Sauerstoff.",
    },
    {
        "id": 6, "label": "#5", "words": 29,
        "badge": "05",
        "headline": "Geheime Schlafkabinen",
        "sub": "Dein Pilot liegt im Bett.",
    },
    {
        "id": 7, "label": "#6", "words": 33,
        "badge": "06",
        "headline": "Einmal pro Jahr Blitzeinschlag",
        "sub": "Schweigen ist Methode.",
    },
    {
        "id": 8, "label": "#7", "words": 36,
        "badge": "07",
        "headline": "Die toedlichen 11 Minuten",
        "sub": "Die meisten Unfaelle -- beim Landen.",
    },
    {
        "id": 9, "label": "OUTRO", "words": 33,
        "badge": None,
        "headline": "7 Geheimnisse fliegen taeglich mit dir",
        "sub": "Die Frage: Wie viele mehr gibt es noch?",
    },
    {
        "id": 10, "label": "CTA", "words": 32,
        "badge": None,
        "headline": "Abonniere diesen Kanal",
        "sub": "Welcher Fakt hat dich am meisten ueberrascht?",
    },
]

W, H = 1920, 1080
BG_COLOR       = (8, 10, 18)
OVERLAY_COLOR  = (8, 10, 18, 210)
ACCENT         = (255, 180, 0)
TEXT_WHITE     = (255, 255, 255)
TEXT_MUTED     = (180, 190, 210)


def load_font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_card(scene, out_path):
    img  = Image.new("RGBA", (W, H), (*BG_COLOR, 255))
    draw = ImageDraw.Draw(img)

    panel_top = H - 340
    panel = Image.new("RGBA", (W, H - panel_top), OVERLAY_COLOR)
    img.paste(panel, (0, panel_top), panel)

    draw.rectangle([(0, panel_top), (W, panel_top + 4)], fill=ACCENT)

    if scene["badge"]:
        bx, by = 100, panel_top + 100
        br = 60
        draw.ellipse([(bx - br, by - br), (bx + br, by + br)], fill=ACCENT)
        f_badge = load_font(46, bold=True)
        draw.text((bx, by), scene["badge"], font=f_badge, fill=BG_COLOR, anchor="mm")
        text_x = bx + br + 50
    else:
        f_label = load_font(30)
        draw.text((80, panel_top + 28), scene["label"], font=f_label, fill=ACCENT)
        text_x = 80

    f_headline = load_font(64, bold=True)
    headline_y = panel_top + 60 if not scene["badge"] else panel_top + 44
    wrapped = textwrap.fill(scene["headline"], width=36)
    draw.text((text_x, headline_y), wrapped, font=f_headline, fill=TEXT_WHITE)

    f_sub = load_font(40)
    line_count = wrapped.count("\n") + 1
    bbox = draw.textbbox((0, 0), "Ag", font=f_headline)
    line_h = bbox[3] - bbox[1]
    sub_y = headline_y + line_h * line_count + 22
    draw.text((text_x, sub_y), scene["sub"], font=f_sub, fill=TEXT_MUTED)

    f_wm = load_font(20)
    draw.text((W - 30, H - 22), "HyperFrames", font=f_wm, fill=(55, 65, 85), anchor="rs")

    img.convert("RGB").save(out_path, "PNG", optimize=True)
    print("  card -> " + out_path)


def build_timing():
    total_words = sum(s["words"] for s in SCENES)
    t = 0.0
    timing = []
    for s in SCENES:
        dur = round(s["words"] / total_words * TOTAL_DURATION, 3)
        timing.append({
            "scene_id":  s["id"],
            "label":     s["label"],
            "start":     round(t, 3),
            "duration":  dur,
            "end":       round(t + dur, 3),
            "card_png":  "cards/scene_{:02d}.png".format(s["id"]),
        })
        t += dur
    return timing


if __name__ == "__main__":
    base = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(base, "cards")
    os.makedirs(out_dir, exist_ok=True)

    print("Generating cards...")
    for s in SCENES:
        path = os.path.join(out_dir, "scene_{:02d}.png".format(s["id"]))
        draw_card(s, path)

    timing = build_timing()
    timing_path = os.path.join(base, "timing.json")
    with open(timing_path, "w", encoding="utf-8") as f:
        json.dump(timing, f, indent=2, ensure_ascii=False)

    print("\ntiming.json saved:")
    for t in timing:
        print("  Scene {:2d} [{:5s}]  {:6.2f}s -> {:6.2f}s  ({:.2f}s)".format(
            t["scene_id"], t["label"], t["start"], t["end"], t["duration"]))
