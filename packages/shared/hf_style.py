"""
HyperFrames Shared Motion Graphics Style Config
------------------------------------------------
Import this in any project's build-video.py to get consistent
caption and card styling across all videos.

Usage:
    from pathlib import Path
    import sys
    sys.path.insert(0, str(Path(__file__).parents[3] / "packages" / "shared"))
    from hf_style import ASS_STYLES, ASS_HEADER, build_ass

Caption spec:
  Font    : Montserrat Bold
  Size    : 42px
  Color   : White (#FFFFFF), active word Gold (#FFD700)
  Outline : 1.5px black, no shadow, no blur
  Position: Bottom-center, MarginV=60
"""

# ── ASS subtitle style ────────────────────────────────────────────────────────
# Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour,
#         OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut,
#         ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow,
#         Alignment, MarginL, MarginR, MarginV, Encoding
ASS_STYLES = """\
Style: Default,Montserrat,42,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,1.5,0,2,30,30,60,1
Style: Highlight,Montserrat,42,&H0000D7FF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,1.5,0,2,30,30,60,1"""

ASS_HEADER_TEMPLATE = """\
[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
{styles}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def ts_ass(t: float) -> str:
    """Convert seconds to ASS timestamp h:mm:ss.cc"""
    h  = int(t // 3600)
    m  = int((t % 3600) // 60)
    s  = int(t % 60)
    cs = int((t % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def build_ass(words: list[dict], width: int = 1280, height: int = 720,
              words_per_line: int = 3) -> str:
    """
    Build a full ASS subtitle file from a list of word-timing dicts.

    Args:
        words: [{"word": str, "start": float, "end": float}, ...]
        width, height: video resolution for PlayRes
        words_per_line: how many words per caption group (default 3)

    Returns:
        Complete ASS file content as a string.
    """
    header = ASS_HEADER_TEMPLATE.format(
        width=width, height=height, styles=ASS_STYLES
    )

    events = []
    for i in range(0, len(words), words_per_line):
        line = words[i : i + words_per_line]

        for wi, word in enumerate(line):
            before = " ".join(w["word"].upper() for w in line[:wi])
            cur    = word["word"].upper()
            after  = " ".join(w["word"].upper() for w in line[wi + 1:])

            parts = []
            if before:
                parts.append(r"{\c&H00FFFFFF&\alpha&H33&}" + before + " ")
            parts.append(r"{\c&H0000D7FF&\alpha&H00&}" + cur)
            if after:
                parts.append(r"{\c&H00FFFFFF&\alpha&H33&}" + " " + after)

            # Clean inline override: thin outline only, no blur, no shadow
            text = r"{\bord1\shad0}" + "".join(parts)

            w_start = word["start"]
            # Hold highlight until next word starts to eliminate gaps between words
            if wi < len(line) - 1:
                w_end = line[wi + 1]["start"]
            else:
                w_end = word["end"]

            events.append(
                f"Dialogue: 0,{ts_ass(w_start)},{ts_ass(w_end)}"
                f",Default,,0,0,0,,{text}"
            )

    return header + "\n".join(events) + "\n"


# ── Card animation helper (GSAP) ──────────────────────────────────────────────
CARD_ENTER_MS = 400   # ms — fade + translate up
CARD_EXIT_MS  = 300   # ms — fade + translate down
CARD_MIN_DURATION_S = 5  # seconds minimum display time per card
