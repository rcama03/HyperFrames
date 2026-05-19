# -*- coding: utf-8 -*-
"""
packages/shared/hf_style.py
Single source of truth for subtitle style across all HyperFrames video projects.

Style locked in:
  Font:           Montserrat Bold, 32px
  Active word:    Gold #FFD700  (fully opaque, only while spoken)
  Inactive words: White, 80% opacity  (before AND after the word)
  Outline:        1.5px black
  Shadow/Blur:    none
  Casing:         ALL CAPS
"""

FONT_NAME    = "Montserrat"
FONT_SIZE    = 32
OUTLINE_SIZE = 1.5

# ASS colour format: &HAABBGGRR  (00=opaque, FF=transparent)
# Gold  #FFD700 -> B=00 G=D7 R=FF -> &H0000D7FF  (fully opaque)
# White 80% opacity -> alpha=0x33 (20% transparent) -> &H33FFFFFF
COL_ACTIVE   = "&H0000D7FF"   # Gold  — current word
COL_INACTIVE = "&H33FFFFFF"   # White 80% — all other words
COL_OUTLINE  = "&H00000000"   # Black outline

WORDS_PER_LINE = 6   # max words shown together on one line


def _fmt_time(seconds):
    """seconds -> H:MM:SS.cc  (ASS centiseconds)"""
    h  = int(seconds // 3600)
    m  = int((seconds % 3600) // 60)
    s  = seconds % 60
    return "{:d}:{:02d}:{:05.2f}".format(h, m, s)


def _ass_header(width, height):
    fontsize  = max(20, int(FONT_SIZE * height / 720))
    margin_v  = max(20, int(30 * height / 720))
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
        # PrimaryColour = white 80% (default for all words)
        # Alignment 2 = bottom-centre
        "Style: Default,{font},{sz},{inactive},&H33FFFFFF,{outline},&H00000000,"
        "-1,0,0,0,100,100,0,0,1,{ol},0,2,10,10,{mv},1\n"
        "\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    ).format(
        w=width, h=height,
        font=FONT_NAME, sz=fontsize,
        inactive=COL_INACTIVE,
        outline=COL_OUTLINE,
        ol=OUTLINE_SIZE,
        mv=margin_v,
    )


def _split_chunks(words, max_words):
    """Split word list into natural chunks of max_words."""
    chunks, chunk = [], []
    for w in words:
        chunk.append(w)
        # Break at punctuation or max length
        if len(chunk) >= max_words or w.rstrip(".,!?—-"):
            if w[-1] in ".,!?—":
                chunks.append(chunk)
                chunk = []
        if len(chunk) >= max_words:
            chunks.append(chunk)
            chunk = []
    if chunk:
        chunks.append(chunk)
    return chunks


def build_ass(scenes, width=1280, height=720):
    """
    Build an ASS subtitle string with per-word gold highlighting.

    Only the currently spoken word is gold; all others (before AND after)
    are white at 80% opacity. Text is ALL CAPS.

    Parameters
    ----------
    scenes : list of dict, each with:
        text  (str)   -- spoken words for this scene
        start (float) -- start time in seconds
        end   (float) -- end time in seconds
    width, height : int  -- video resolution for font scaling

    Returns
    -------
    str : complete .ass file contents
    """
    events = [_ass_header(width, height)]

    for sc in scenes:
        raw_words = sc["text"].upper().split()
        if not raw_words:
            continue
        duration  = sc["end"] - sc["start"]
        total_w   = len(raw_words)
        t         = sc["start"]

        chunks = _split_chunks(raw_words, WORDS_PER_LINE)

        for chunk in chunks:
            chunk_dur      = len(chunk) / total_w * duration
            sec_per_word   = chunk_dur / len(chunk)

            for wi in range(len(chunk)):
                word_start = t + wi * sec_per_word
                word_end   = word_start + sec_per_word

                # Build the full line — only word wi is gold, rest default (white 80%)
                parts = []
                for j, word in enumerate(chunk):
                    if j == wi:
                        # Gold, fully opaque, then reset to style default (white 80%)
                        parts.append(
                            "{\\c&H0000D7FF&\\alpha&H00&}" + word + "{\\r}"
                        )
                    else:
                        parts.append(word)

                text = " ".join(parts)
                events.append(
                    "Dialogue: 0,{},{},Default,,0,0,0,,{}".format(
                        _fmt_time(word_start), _fmt_time(word_end), text
                    )
                )

            t += chunk_dur

    return "\n".join(events) + "\n"
