# -*- coding: utf-8 -*-
"""
packages/shared/hf_style.py
Single source of truth for subtitle style across all HyperFrames video projects.

Style locked in:
  Font:           Montserrat Bold, 32px
  Active word:    Gold #FFD700
  Inactive words: White, 80% opacity
  Outline:        1.5px black
  Shadow:         none
  Blur:           none
"""

FONT_NAME    = "Montserrat"
FONT_SIZE    = 32
OUTLINE_SIZE = 1.5

# ASS colour format: &HAABBGGRR  (alpha 00=opaque, FF=transparent)
# Gold  #FFD700 -> R=FF G=D7 B=00 -> &H0000D7FF
# White 80% opacity -> alpha = int(255*0.20) = 51 = 0x33
COL_ACTIVE   = "&H0000D7FF"   # Gold  - current word
COL_INACTIVE = "&H33FFFFFF"   # White 80% - words not yet reached
COL_OUTLINE  = "&H00000000"   # Black outline
COL_BACK     = "&H00000000"


def _fmt_time(seconds):
    """Convert seconds to ASS time string H:MM:SS.cc"""
    h  = int(seconds // 3600)
    m  = int((seconds % 3600) // 60)
    s  = seconds % 60
    return "{:d}:{:02d}:{:05.2f}".format(h, m, s)


def _ass_header(width, height):
    fontsize = max(20, int(FONT_SIZE * height / 720))
    margin_v = max(20, int(40 * height / 720))
    return (
        "[Script Info]\n"
        "ScriptType: v4.00+\n"
        "PlayResX: {w}\n"
        "PlayResY: {h}\n"
        "ScaledBorderAndShadow: yes\n"
        "\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
        "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
        "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding\n"
        "Style: Default,{font},{sz},{pri},{sec},{out},{back},"
        "-1,0,0,0,100,100,0,0,1,{outline},0,2,10,10,{mv},1\n"
        "\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    ).format(
        w=width, h=height,
        font=FONT_NAME, sz=fontsize,
        pri=COL_ACTIVE, sec=COL_INACTIVE,
        out=COL_OUTLINE, back=COL_BACK,
        outline=OUTLINE_SIZE, mv=margin_v,
    )


def build_ass(scenes, width=1280, height=720):
    """
    Build an ASS karaoke subtitle string.

    Parameters
    ----------
    scenes : list of dict
        Each dict must have:
            text  (str)   -- the spoken words for this scene
            start (float) -- scene start time in seconds
            end   (float) -- scene end time in seconds
    width, height : int
        Video resolution (used for font scaling).

    Returns
    -------
    str : complete .ass file contents
    """
    lines = [_ass_header(width, height)]
    WORDS_PER_LINE = 8   # max words per subtitle line

    for sc in scenes:
        words    = sc["text"].split()
        if not words:
            continue
        duration = sc["end"] - sc["start"]
        total_w  = len(words)
        t        = sc["start"]

        # Split into chunks so no line is too long
        chunks = [words[i:i + WORDS_PER_LINE]
                  for i in range(0, total_w, WORDS_PER_LINE)]

        for chunk in chunks:
            chunk_dur = len(chunk) / total_w * duration
            cs_each   = max(1, int(chunk_dur * 100 / len(chunk)))
            text      = "".join(
                "{\\k" + str(cs_each) + "}" + w + " " for w in chunk
            ).rstrip()
            lines.append(
                "Dialogue: 0,{},{},Default,,0,0,0,,{}".format(
                    _fmt_time(t), _fmt_time(t + chunk_dur), text
                )
            )
            t += chunk_dur

    return "\n".join(lines) + "\n"
