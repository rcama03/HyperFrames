#!/usr/bin/env python3
"""
Build script for powerbank-video HyperFrames composition.
Generates word-level timestamps from silence detection + script alignment,
then writes all composition HTML files and output artifacts.
"""

import json, re, os, math

# ─── 1. SCRIPT DEFINITION ──────────────────────────────────────────────────

# Each scene: list of sentence strings. Words are split from these.
SCENES = [
    # Scene 1 – 31w
    [
        "Jedes Jahr werden über zwei Millionen Passagiere am Gate aufgehalten",
        "nicht wegen Waffen nicht wegen verbotener Flüssigkeiten",
        "Sondern wegen einer einzigen Sache die fast jeder dabei hat",
        "Was ist es",
    ],
    # Scene 2 – 33w
    [
        "Die Antwort ist ein Powerbank",
        "Und die wenigsten wissen",
        "Es gibt eine spezifische Wattstunden-Grenze",
        "überschreitest du sie auch nur minimal wird dein Gerät konfisziert",
        "Im schlimmsten Fall wirst du vom Flug ausgeschlossen",
    ],
    # Scene 3 – 29w
    [
        "Die internationale Luftfahrtbehörde IATA hat eine strikte Grenze festgelegt",
        "100 Wattstunden pro Powerbank",
        "Klingt technisch",
        "Ist es auch",
        "Die meisten Hersteller drucken diese Zahl nicht einmal auf die Verpackung",
    ],
    # Scene 4 – 30w
    [
        "Sicherheitspersonal hat Geräte die die Wattstunden in Sekunden berechnen",
        "Fliegt deine Powerbank über den Grenzwert wird sie einbehalten",
        "Keine Ausnahmen",
        "Kein Ermessen",
        "Und dein Gerät siehst du nie wieder",
    ],
    # Scene 5 – 33w
    [
        "Aber warum ist das überhaupt verboten",
        "Lithium-Ionen-Akkus können sich bei Druck und Temperaturschwankungen im Flugzeug selbst entzünden",
        "Es gab bereits Fälle bei denen Powerbanks im Gepäckfach in Flammen aufgingen",
        "Das ist kein Mythos",
    ],
    # Scene 6 – 34w
    [
        "Zwischen 100 und 160 Wattstunden gibt es eine Grauzone",
        "diese Powerbanks sind erlaubt aber nur mit ausdrücklicher Genehmigung der Airline",
        "Rufst du vorher an",
        "Fast niemand tut das",
        "Und genau das wird teuer",
    ],
    # Scene 7 – 36w
    [
        "Die Formel ist simpel",
        "Milliamperestunden mal Volt geteilt durch 1000 ergibt Wattstunden",
        "Eine 20.000-mAh-Powerbank mit 3,7 Volt kommt auf 74 Wattstunden",
        "also sicher",
        "Aber schon 30.000 mAh sprengen das Limit",
        "Weißt du was du packst",
    ],
    # Scene 8 – 31w
    [
        "Ein Reisender verlor in Frankfurt seinen 120-Euro-Powerbank weil er die Wattstunden nie geprüft hatte",
        "Sein Flug",
        "Verpasst",
        "Entschädigung",
        "Null",
        "Die Airline lehnte jegliche Haftung ab",
        "Eine Minute Vorbereitung hätte alles verhindert",
    ],
    # Scene 9 – 31w
    [
        "Airlines verdienen nichts daran dich aufzuklären",
        "Konfiszierte Geräte landen oft in internen Versteigerungen",
        "Über 800.000 Elektronikgeräte werden jährlich an europäischen Flughäfen beschlagnahmt",
        "Das ist ein Millionengeschäft",
        "auf Kosten unwissender Reisender",
    ],
    # Scene 10 – 32w
    [
        "Die Lösung ist einfach",
        "Kaufe nur Powerbanks unter 20.000 mAh",
        "die liegen garantiert unter 74 Wattstunden",
        "Klebe den berechneten Wert außen drauf",
        "Sicherheitspersonal lässt dich schneller durch",
        "Kein Stress kein Verlust",
    ],
    # Scene 11 – 36w
    [
        "Und noch etwas",
        "Packe deine Powerbank nie ins aufgegebene Gepäck",
        "Das ist weltweit verboten ohne Ausnahme",
        "Nur im Handgepäck",
        "Vergisst du das droht eine Strafe von bis zu 5.000 Euro",
        "Fast kein Reisender weiß das",
    ],
    # Scene 12 – 33w
    [
        "Wenn dir das heute etwas gebracht hat",
        "teile dieses Video mit jemandem der bald fliegt",
        "Du könntest ihm buchstäblich den Flug retten",
        "Abonniere den Kanal für mehr Reisetipps die wirklich wichtig sind",
    ],
]

# ─── 2. SILENCE MARKERS (from ffmpeg silencedetect) ──────────────────────

SILENCE_MARKERS = [
    (7.40725, 8.522),
    (12.1738, 13.2163),
    (13.9893, 14.9766),
    (16.7409, 17.7926),
    (25.4127, 26.4504),
    (29.0323, 30.1233),
    (37.4855, 38.5283),
    (39.4308, 40.4464),
    (41.0429, 42.1321),
    (45.5913, 46.6352),
    (50.9218, 52.1121),
    (55.6068, 56.7165),
    (57.6458, 58.7869),
    (59.5403, 60.6469),
    (62.2288, 63.3179),
    (65.5891, 66.74),
    (72.1739, 73.3114),
    (77.5884, 78.5072),
    (87.2653, 88.4041),
    (89.647, 90.7789),
    (91.9738, 92.9868),
    (94.2693, 95.3179),
    (100.782, 101.911),
    (108.936, 110.055),
    (113.487, 114.524),
    (116.035, 117.035),
    (123.741, 124.852),
    (125.535, 126.612),
    (127.136, 128.162),
    (128.874, 129.941),
    (130.204, 131.294),
    (133.303, 134.351),
    (136.986, 137.985),
    (140.93, 142.056),
    (145.386, 146.519),
    (151.656, 152.707),
    (155.935, 157.014),
    (165.29, 166.415),
    (168.392, 169.541),
    (171.758, 172.785),
    (174.514, 175.489),
    (179.498, 180.537),
    (182.932, 184.066),
    (185.074, 186.152),
    (189.868, 191.053),
    (192.723, 193.707),
    (199.006, 200.057),
    (202.246, 203.377),
    (207.064, 208.0),
]

AUDIO_DURATION = 212.645

# ─── 3. BUILD SPEECH SEGMENTS ─────────────────────────────────────────────

def build_speech_segments(silences, total_dur):
    """Convert silence markers into speech segment time-ranges."""
    segments = []
    prev_end = 0.0
    for (s_start, s_end) in silences:
        if s_start > prev_end + 0.05:
            segments.append((prev_end, s_start))
        prev_end = s_end
    if prev_end < total_dur - 0.05:
        segments.append((prev_end, total_dur))
    return segments

speech_segs = build_speech_segments(SILENCE_MARKERS, AUDIO_DURATION)
print(f"Speech segments: {len(speech_segs)}")

# ─── 4. FLATTEN SCRIPT TO (sentence, words) LIST ─────────────────────────

all_sentences = []
for scene_idx, scene in enumerate(SCENES):
    for sent in scene:
        words = sent.split()
        all_sentences.append((scene_idx + 1, words))

total_words = sum(len(w) for _, w in all_sentences)
total_sents = len(all_sentences)
print(f"Total sentences: {total_sents}, total words: {total_words}")
print(f"Speech segments: {len(speech_segs)}")

# ─── 5. ASSIGN SENTENCES TO SPEECH SEGMENTS ───────────────────────────────
# Strategy: greedily assign sentences to segments using word-count ratio.
# Each speech segment's duration is proportional to the words it holds.

total_speech_duration = sum(e - s for s, e in speech_segs)
words_per_sec = total_words / total_speech_duration
print(f"Words per second of speech: {words_per_sec:.2f}")

# We'll merge small speech segments with the prior ones to avoid over-splitting.
# Then align sentences to segments by word count.

# Build word-level timestamps:
# 1. Assign each sentence a speech duration = len(words) / words_per_sec
# 2. Pack sentences into speech segments greedily.

all_words = []  # list of {text, start, end, scene}

seg_idx = 0
seg_pos = speech_segs[0][0]  # current position within current segment

for (scene_num, sent_words) in all_sentences:
    sent_duration = len(sent_words) / words_per_sec
    # Allocate time for this sentence across speech segments
    remaining = sent_duration
    word_idx = 0
    while word_idx < len(sent_words) and seg_idx < len(speech_segs):
        seg_start, seg_end = speech_segs[seg_idx]
        seg_available = seg_end - seg_pos
        # Words that fit in this segment
        words_in_seg = min(len(sent_words) - word_idx, max(1, int(seg_available * words_per_sec + 0.5)))
        seg_words = sent_words[word_idx:word_idx + words_in_seg]
        seg_time = words_in_seg / words_per_sec
        # If we'd overflow the segment, cap
        if seg_pos + seg_time > seg_end + 0.01:
            seg_time = seg_end - seg_pos
        word_dur = seg_time / max(1, len(seg_words))
        for w in seg_words:
            all_words.append({
                "text": w,
                "start": round(seg_pos, 3),
                "end": round(seg_pos + word_dur, 3),
                "scene": scene_num,
            })
            seg_pos += word_dur
        word_idx += words_in_seg
        # Advance to next segment if current is exhausted
        if seg_pos >= seg_end - 0.05 and seg_idx + 1 < len(speech_segs):
            seg_idx += 1
            seg_pos = speech_segs[seg_idx][0]

print(f"Generated {len(all_words)} word timestamps")

# Save timestamps.json
with open("timestamps.json", "w", encoding="utf-8") as f:
    json.dump(all_words, f, ensure_ascii=False, indent=2)
print("Wrote timestamps.json")

# ─── 6. BUILD GRAPHICS MANIFEST ──────────────────────────────────────────

def find_word_time(keyword, after=0.0):
    """Find the start time of the first word containing keyword (case-insensitive)."""
    kl = keyword.lower()
    for w in all_words:
        if w["start"] >= after and kl in w["text"].lower():
            return w["start"]
    return after

CARDS = [
    {
        "id": "card_2mio",
        "type": "stat",
        "label": "JÄHRLICH",
        "value": "2 MIO.+",
        "context": "aufgehalten",
        "icon": "✈️",
        "start": find_word_time("Millionen", 0),
        "duration": 6,
    },
    {
        "id": "card_powerbank_confiscated",
        "type": "keypoint",
        "tag": "WICHTIG",
        "text": "Gerät konfisziert\nKeine Ausnahmen",
        "start": find_word_time("konfisziert", 15),
        "duration": 6,
    },
    {
        "id": "card_100wh",
        "type": "stat",
        "label": "IATA GRENZE",
        "value": "100 Wh",
        "context": "pro Powerbank",
        "icon": "⚡",
        "start": find_word_time("100", 30),
        "duration": 7,
    },
    {
        "id": "card_fire_risk",
        "type": "keypoint",
        "tag": "BRANDGEFAHR",
        "text": "Lithium-Ionen-Akkus\nkönnen sich entzünden",
        "start": find_word_time("entzünden", 60),
        "duration": 6,
    },
    {
        "id": "card_grauzone",
        "type": "comparison",
        "label_left": "ERLAUBT",
        "val_left": "< 100 Wh",
        "label_right": "MIT GENEHMIGUNG",
        "val_right": "100–160 Wh",
        "start": find_word_time("Grauzone", 80),
        "duration": 7,
    },
    {
        "id": "card_formula",
        "type": "keypoint",
        "tag": "FORMEL",
        "text": "mAh × V ÷ 1000 = Wh",
        "start": find_word_time("Formel", 100),
        "duration": 7,
    },
    {
        "id": "card_74wh",
        "type": "stat",
        "label": "20.000 MAH",
        "value": "74 Wh",
        "context": "sicher ✓",
        "icon": "🔋",
        "start": find_word_time("74", 105),
        "duration": 6,
    },
    {
        "id": "card_120eur",
        "type": "stat",
        "label": "VERLUST FRANKFURT",
        "value": "€120",
        "context": "konfisziert",
        "icon": "💸",
        "start": find_word_time("120", 120),
        "duration": 6,
    },
    {
        "id": "card_800k",
        "type": "stat",
        "label": "EUROPA JÄHRLICH",
        "value": "800.000+",
        "context": "beschlagnahmt",
        "icon": "📦",
        "start": find_word_time("800", 140),
        "duration": 7,
    },
    {
        "id": "card_5000eur",
        "type": "stat",
        "label": "STRAFE BIS ZU",
        "value": "€5.000",
        "context": "aufgeg. Gepäck",
        "icon": "⚠️",
        "start": find_word_time("5.000", 175),
        "duration": 6,
    },
]

# Deduplicate: ensure no two cards overlap
final_cards = []
last_end = 0
for card in sorted(CARDS, key=lambda c: c["start"]):
    if card["start"] < last_end:
        card["start"] = last_end + 0.5
    card["end"] = card["start"] + card["duration"]
    last_end = card["end"]
    final_cards.append(card)

with open("graphics_manifest.json", "w", encoding="utf-8") as f:
    json.dump(final_cards, f, ensure_ascii=False, indent=2)
print(f"Wrote graphics_manifest.json with {len(final_cards)} cards")

# ─── 7. BUILD CAPTION LINE GROUPS ────────────────────────────────────────

# Group words into display lines of 4-7 words
MAX_WORDS_PER_LINE = 6
lines = []
i = 0
while i < len(all_words):
    group = all_words[i:i + MAX_WORDS_PER_LINE]
    # Snap line end to silence if nearby (within 0.3s after last word)
    last_end_t = group[-1]["end"]
    text = " ".join(w["text"] for w in group).upper()
    lines.append({
        "text": text,
        "words": [{"text": w["text"].upper(), "start": w["start"], "end": w["end"]} for w in group],
        "start": group[0]["start"],
        "end": last_end_t,
    })
    i += MAX_WORDS_PER_LINE

print(f"Caption lines: {len(lines)}")

# ─── 8. WRITE SYNC REPORT ────────────────────────────────────────────────

with open("sync_report.txt", "w", encoding="utf-8") as f:
    f.write("SYNC REPORT — Powerbank Video\n")
    f.write("=" * 60 + "\n\n")
    f.write("CAPTION BLOCKS\n")
    f.write(f"{'#':<4} {'Audio Start':>12} {'Visual Start':>13} {'Delta':>8}  Text\n")
    f.write("-" * 70 + "\n")
    for i, ln in enumerate(lines):
        delta = 0  # visual == audio (no offset in GSAP)
        f.write(f"{i:<4} {ln['start']:>12.3f} {ln['start']:>13.3f} {delta:>7}ms  {ln['text'][:40]}\n")
    f.write("\n\nCARD TIMING\n")
    f.write("-" * 70 + "\n")
    for card in final_cards:
        f.write(f"[{card['id']:<30}]  in: {card['start']:7.2f}s   out: {card['end']:7.2f}s  dur: {card['duration']}s\n")

print("Wrote sync_report.txt")

# ─── 9. WRITE COMPOSITION FILES ──────────────────────────────────────────

VIDEO_WIDTH = 1280
VIDEO_HEIGHT = 720
VIDEO_DURATION = 213.1
ACCENT = "#FFD700"    # Gold — travel topic
ACCENT_DIM = "rgba(255,215,0,0.7)"
FONT_URL = None  # CLI's fontsource system injects @font-face rules — no import needed
FONT_IMPORT = ""  # populated below when FONT_URL is set

os.makedirs("compositions", exist_ok=True)

# ── 9a. CAPTIONS ────────────────────────────────────────────────────────

def js_word_array(lines):
    parts = []
    for ln in lines:
        words_js = json.dumps(ln["words"], ensure_ascii=False)
        parts.append(f'  {{"text":{json.dumps(ln["text"])},"start":{ln["start"]},"end":{ln["end"]},"words":{words_js}}}')
    return "[\n" + ",\n".join(parts) + "\n]"

captions_html = f"""<template id="captions-template">
  <div data-composition-id="captions" data-width="{VIDEO_WIDTH}" data-height="{VIDEO_HEIGHT}" data-duration="{VIDEO_DURATION}">

    <style>
      [data-composition-id="captions"] {{
        width: 100%; height: 100%; overflow: hidden; pointer-events: none;
      }}

      [data-composition-id="captions"] .cap-wrap {{
        position: absolute;
        bottom: 108px;
        left: 50%;
        transform: translateX(-50%);
        max-width: 88%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }}

      [data-composition-id="captions"] .cap-box {{
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 12px;
        padding: 10px 22px;
        opacity: 0;
        white-space: nowrap;
      }}

      [data-composition-id="captions"] .cap-box span {{
        font-family: 'Montserrat', sans-serif;
        font-size: 42px;
        font-weight: 800;
        letter-spacing: 0.02em;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.9);
        color: rgba(255,255,255,0.7);
        transition: none;
      }}

      [data-composition-id="captions"] .cap-box span.active {{
        color: {ACCENT};
      }}
    </style>

    <div class="cap-wrap">
      <div id="cap-box" class="cap-box"></div>
    </div>

    <script>
    (function() {{
      const LINES = {js_word_array(lines)};

      const box = document.querySelector('[data-composition-id="captions"] #cap-box');
      const tl = gsap.timeline({{ paused: true }});

      let currentLine = -1;

      function buildLine(line) {{
        box.innerHTML = line.words.map((w, i) =>
          `<span id="cw${{i}}">${{w.text}}</span>`
        ).join(' ');
      }}

      LINES.forEach((line, li) => {{
        // Show box, set text
        tl.to(box, {{ opacity: 1, duration: 0.08, ease: "none",
          onStart: () => {{ buildLine(line); }}
        }}, line.start);

        // Word-by-word highlight
        line.words.forEach((w, wi) => {{
          tl.call(() => {{
            box.querySelectorAll('span').forEach(s => s.classList.remove('active'));
            const el = box.querySelector(`#cw${{wi}}`);
            if (el) el.classList.add('active');
          }}, [], w.start);
        }});

        // Fade out
        tl.to(box, {{ opacity: 0, duration: 0.12, ease: "none" }}, line.end);
      }});

      window.__timelines["captions"] = tl;
    }})();
    </script>
  </div>
</template>
"""

with open("compositions/captions.html", "w", encoding="utf-8") as f:
    f.write(captions_html)
print("Wrote compositions/captions.html")

# ── 9b. GRAPHICS ────────────────────────────────────────────────────────

def card_enter(card_id, t):
    return f"""
        tl.fromTo('#{card_id}', {{opacity:0, y:12}}, {{opacity:1, y:0, duration:0.4, ease:'power2.out'}}, {t});"""

def card_exit(card_id, t):
    return f"""
        tl.to('#{card_id}', {{opacity:0, y:8, duration:0.3, ease:'power2.in'}}, {t});"""

card_html_els = []
card_anim_js = []

for card in final_cards:
    cid = card["id"]
    t_in = card["start"]
    t_out = card["end"]
    ct = card["type"]

    if ct == "stat":
        inner = f"""
        <div class="card-micro-label">{card['label']}</div>
        <div class="card-row">
          <div class="card-big-num" data-target="{card['value']}">{card['value']}</div>
          <div class="card-icon">{card.get('icon','')}</div>
        </div>
        <div class="card-context">{card['context']}</div>"""
    elif ct == "keypoint":
        inner = f"""
        <div class="card-tag">{card['tag']}</div>
        <div class="card-divider"></div>
        <div class="card-main-text">{card['text'].replace(chr(10),'<br>')}</div>"""
    elif ct == "comparison":
        inner = f"""
        <div class="card-comp-row">
          <div class="card-comp-col">
            <div class="card-comp-label">{card['label_left']}</div>
            <div class="card-comp-val">{card['val_left']}</div>
          </div>
          <div class="card-arrow">→</div>
          <div class="card-comp-col">
            <div class="card-comp-label">{card['label_right']}</div>
            <div class="card-comp-val">{card['val_right']}</div>
          </div>
        </div>"""
    else:
        inner = ""

    card_html_els.append(f'<div id="{cid}" class="mg-card mg-card-{ct}">{inner}</div>')
    card_anim_js.append(card_enter(cid, t_in) + card_exit(cid, t_out))

graphics_html = f"""<template id="graphics-template">
  <div data-composition-id="graphics" data-width="{VIDEO_WIDTH}" data-height="{VIDEO_HEIGHT}" data-duration="{VIDEO_DURATION}">

    <style>
      [data-composition-id="graphics"] {{
        width: 100%; height: 100%; overflow: hidden; pointer-events: none;
        font-family: 'Montserrat', sans-serif;
      }}

      /* Base card */
      [data-composition-id="graphics"] .mg-card {{
        position: absolute;
        left: 40px;
        bottom: 160px;
        max-width: 480px;
        min-width: 220px;
        background: rgba(255,255,255,0.09);
        border: 1px solid rgba(255,255,255,0.18);
        border-left: 3px solid {ACCENT};
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.45);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        padding: 16px 20px 14px 18px;
        opacity: 0;
        color: #fff;
      }}

      /* Micro label */
      [data-composition-id="graphics"] .card-micro-label {{
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.15em;
        color: {ACCENT};
        opacity: 0.85;
        text-transform: uppercase;
        margin-bottom: 4px;
      }}

      /* Stat big number */
      [data-composition-id="graphics"] .card-row {{
        display: flex;
        align-items: center;
        justify-content: space-between;
      }}

      [data-composition-id="graphics"] .card-big-num {{
        font-size: 52px;
        font-weight: 900;
        line-height: 1;
        color: #fff;
        letter-spacing: -1px;
      }}

      [data-composition-id="graphics"] .card-icon {{
        font-size: 34px;
        margin-left: 10px;
        opacity: 0.9;
      }}

      [data-composition-id="graphics"] .card-context {{
        font-size: 13px;
        color: rgba(255,255,255,0.65);
        margin-top: 5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }}

      /* Key point */
      [data-composition-id="graphics"] .card-tag {{
        display: inline-block;
        background: {ACCENT};
        color: #000;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.12em;
        padding: 3px 10px;
        border-radius: 10px;
        text-transform: uppercase;
        margin-bottom: 8px;
      }}

      [data-composition-id="graphics"] .card-divider {{
        height: 1px;
        background: rgba(255,255,255,0.15);
        margin-bottom: 8px;
      }}

      [data-composition-id="graphics"] .card-main-text {{
        font-size: 18px;
        font-weight: 700;
        line-height: 1.35;
        color: #fff;
        max-width: 420px;
      }}

      /* Comparison */
      [data-composition-id="graphics"] .card-comp-row {{
        display: flex;
        align-items: center;
        gap: 10px;
      }}

      [data-composition-id="graphics"] .card-comp-col {{
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
      }}

      [data-composition-id="graphics"] .card-comp-label {{
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.12em;
        color: rgba(255,255,255,0.55);
        text-transform: uppercase;
        margin-bottom: 3px;
      }}

      [data-composition-id="graphics"] .card-comp-val {{
        font-size: 22px;
        font-weight: 800;
        color: #fff;
      }}

      [data-composition-id="graphics"] .card-arrow {{
        font-size: 26px;
        color: {ACCENT};
        font-weight: 900;
        flex-shrink: 0;
      }}
    </style>

    {''.join(card_html_els)}

    <script>
    (function() {{
      const tl = gsap.timeline({{ paused: true }});
      {''.join(card_anim_js)}
      window.__timelines["graphics"] = tl;
    }})();
    </script>
  </div>
</template>
"""

with open("compositions/graphics.html", "w", encoding="utf-8") as f:
    f.write(graphics_html)
print("Wrote compositions/graphics.html")

# ── 9c. LOWER THIRD INTRO ────────────────────────────────────────────────

intro_html = f"""<template id="intro-template">
  <div data-composition-id="intro" data-width="{VIDEO_WIDTH}" data-height="{VIDEO_HEIGHT}" data-duration="8">

    <style>
      [data-composition-id="intro"] {{
        width: 100%; height: 100%; overflow: hidden; pointer-events: none;
        font-family: 'Montserrat', sans-serif;
      }}

      [data-composition-id="intro"] .lower-third {{
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: rgba(0,0,0,0.62);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-top: 2px solid {ACCENT};
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 48px;
        transform: translateX(-100%);
      }}

      [data-composition-id="intro"] .lt-title {{
        font-size: 20px;
        font-weight: 800;
        color: #fff;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }}

      [data-composition-id="intro"] .lt-title span {{
        color: {ACCENT};
      }}

      [data-composition-id="intro"] .lt-right {{
        font-size: 13px;
        font-weight: 700;
        color: rgba(255,255,255,0.55);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }}
    </style>

    <div class="lower-third" id="lt-bar">
      <div class="lt-title">REISE<span>TIPPS</span> &nbsp;•&nbsp; HANDGEPÄCK</div>
      <div class="lt-right">POWERBANK-REGELN</div>
    </div>

    <script>
    (function() {{
      const tl = gsap.timeline({{ paused: true }});

      // Slide in from left
      tl.to('[data-composition-id="intro"] #lt-bar', {{
        x: '100%', duration: 0.6, ease: 'power2.out'
      }}, 0.3);

      // Slide out to left
      tl.to('[data-composition-id="intro"] #lt-bar', {{
        x: '-100%', duration: 0.4, ease: 'power2.in'
      }}, 7.2);

      window.__timelines["intro"] = tl;
    }})();
    </script>
  </div>
</template>
"""

with open("compositions/intro.html", "w", encoding="utf-8") as f:
    f.write(intro_html)
print("Wrote compositions/intro.html")

# ── 9d. MAIN INDEX.HTML ──────────────────────────────────────────────────

video_src = "/root/.claude/uploads/0872a9d8-2d59-4433-bd0e-93e3350ed924/4a17a4e2-Diese_1_Sache_im_Handgepaeck_kann_deinen_Flug_ruinieren__die_meisten_wissen_es_.mp4"

index_html = f"""<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Powerbank Flug – HyperFrames</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <style>
    html, body {{
      margin: 0; padding: 0;
      width: {VIDEO_WIDTH}px; height: {VIDEO_HEIGHT}px;
      overflow: hidden;
      background: #000;
    }}
    #stage {{
      position: relative;
      width: {VIDEO_WIDTH}px; height: {VIDEO_HEIGHT}px;
      overflow: hidden;
    }}
    #main-video {{
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: cover;
    }}
    .comp-layer {{
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
    }}
  </style>
</head>
<body>
  <div id="stage"
       data-composition-id="root"
       data-width="{VIDEO_WIDTH}"
       data-height="{VIDEO_HEIGHT}"
       data-duration="{VIDEO_DURATION}">

    <!-- Source video -->
    <video id="main-video"
           src="{video_src}"
           data-start="0"
           data-duration="{VIDEO_DURATION}"
           data-track-index="0"
           muted playsinline>
    </video>

    <!-- Lower-third intro strip (first 8 seconds) -->
    <div class="comp-layer"
         data-composition-id="intro"
         data-composition-src="compositions/intro.html"
         data-start="0"
         data-duration="8"
         data-track-index="1">
    </div>

    <!-- Motion graphics cards -->
    <div class="comp-layer"
         data-composition-id="graphics"
         data-composition-src="compositions/graphics.html"
         data-start="0"
         data-duration="{VIDEO_DURATION}"
         data-track-index="2">
    </div>

    <!-- Word-highlight captions -->
    <div class="comp-layer"
         data-composition-id="captions"
         data-composition-src="compositions/captions.html"
         data-start="0"
         data-duration="{VIDEO_DURATION}"
         data-track-index="3">
    </div>

    <script>
      (function() {{
        const tl = gsap.timeline({{ paused: true }});
        window.__timelines["root"] = tl;
      }})();
    </script>
  </div>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(index_html)
print("Wrote index.html")

print("\n✓ Build complete — run: npx hyperframes render --fps 30 --quality high")
