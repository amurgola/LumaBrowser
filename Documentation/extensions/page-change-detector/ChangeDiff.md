# ChangeDiff

`extensions/page-change-detector/ChangeDiff.js`

Fingerprints page text and summarizes a change.

## Methods (static)

- `checksum(text)`: sha256 hex.
- `summarize(oldText, newText)`: `initial snapshot (N chars)` without old text;
  otherwise a stats header (`+3 / -1`, or `whitespace / formatting only`)
  followed by up to 4 `+ added` then 4 `- removed` lines, each cut at 140
  characters with an ellipsis. Lines are trimmed and blank ones ignored; the
  comparison is by set membership, not order.

## Why

The summary is one string so the history table stays simple; the panel splits
it and colours lines by their `+ ` / `- ` prefix. The old text is the stored
500-character preview, so a change beyond it only shows in the stats.
