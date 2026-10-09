# KokoroTokenPatcher

`core/tts-server/models/KokoroTokenPatcher.js`

Appends missing r-colored vowel aliases to a Kokoro model's `tokens.txt` so
sherpa stops dropping word endings.

## Methods

- `KokoroTokenPatcher.patch(modelDir)` returns `true` when `tokens.txt` was
  modified. For each alias pair whose first symbol is missing, it appends
  `<symbol> <id>` using the plain neighbour's id (or the schwa's id when the
  neighbour is missing too). Idempotent; `false` when nothing was missing, when
  no anchor symbol exists, or when there is no `tokens.txt`.
- `KokoroTokenPatcher.ALIASES` is `[[U+025A, U+0259], [U+025D, U+025C]]`;
  `FALLBACK_SYMBOL` is U+0259 (schwa).

## Why

espeak-ng (sherpa's English G2P) emits the American r-colored vowels U+025A
("calendAR", "theatER") and U+025D ("bIRd"), but Kokoro v1.x token sets lack
both. sherpa then silently drops the phoneme, amputating word endings
("calend", "theat"). Verified live 2026-08-03: aliasing each to its plain
neighbour voices the ending again with a mild British colour, which beats
truncation. Models that already carry the phonemes (v0.19) are left alone.
