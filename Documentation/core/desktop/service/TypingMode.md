# TypingMode

`core/desktop/service/TypingMode.js`

How `desktop_type` puts text into a window.

## Members

- `TypingMode.MODES` `['auto', 'keys', 'paste']`; `isValid(mode)`.
- `TypingMode.shouldPaste(text)` true above `PASTE_MIN_CHARS` (200) or when the
  text contains a script an input method handles (`IME_HOSTILE`).
- `TypingMode.IME_HOSTILE_RANGES` the code point ranges: Hangul Jamo, CJK radicals
  through unified ideographs, Hangul extended and syllables, compatibility
  ideographs, full-width forms, and the supplementary ideograph planes.
  `IME_HOSTILE` is the regex built from them.

## Why

Unicode keystrokes into an IME-enabled field get recomposed or dropped by the
IME; a paste inserts them verbatim. Long text pastes because keystrokes are slow
and every one re-checks the foreground.
