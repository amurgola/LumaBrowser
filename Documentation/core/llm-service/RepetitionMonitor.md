# RepetitionMonitor

`core/llm-service/RepetitionMonitor.js`

Watches streamed model output and trips when it falls into a verbatim
repetition loop, so the caller can abort instead of spinning to the token
limit (common on local quantized reasoning models cycling `<think>` lines).

## Methods

- `new RepetitionMonitor(options)` overrides any of `RepetitionMonitor.DEFAULTS`.
- `push(text)` feeds a streamed chunk; returns true once a loop is found and
  stays true until reset.
- `reset()` clears all state.
- `tripped` (boolean) and `reason` (`'line-block'`, `'char-cycle'` or null) are
  readable fields.
- `RepetitionMonitor.normalizeLine(line)` collapses whitespace and lowercases.

## Why

Detection is line-oriented because that is the dominant failure mode: a block
of one or more lines repeating back to back `repeatThreshold` (3) times. A
single repeating line needs 6 repeats, because code legitimately stacks an
identical line a few times while a real one-line loop runs forever. A bounded
character-level scan (only once the current line passes 80 characters)
catches loops that never emit a newline.

To keep false positives down, the repeating unit must carry at least 8
characters, an alphanumeric, and 3 distinct non-space characters. Separators,
markdown rules, comment banners and ASCII art repeat one or two characters;
the old length-only test called them loops and killed Code mode mid-sentence.

Work per token is bounded and history capped (400 lines, 1600-char window).
