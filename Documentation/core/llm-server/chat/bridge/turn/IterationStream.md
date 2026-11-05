# IterationStream

`core/llm-server/chat/bridge/turn/IterationStream.js`

The content-token handler for one completion.

## Methods

- `new IterationStream({ hooks, mirror, allows })`; `onToken(token)` (bound):
  buffers; the first time the buffer holds ```` ```tool ````, an XML opener or
  the DSML prefix ([DsmlToolCallParser](../parsing/DsmlToolCallParser.md)`.EARLY`:
  `<｜DS` with the fullwidth bar, three characters into DeepSeek's markup, or the
  complete `<|DSML|` with an ASCII bar), suppresses the iteration on the
  [StreamMirror](StreamMirror.md) and starts the [PendingToolCard](PendingToolCard.md)
  at the earliest opener; while suppressed, keeps the card updated (the card is
  "preparing" until the invoke name streams in, then named, then targeted);
  mirrors the token otherwise; feeds the [ArtifactStreamPreview](ArtifactStreamPreview.md).
- `IterationStream._callStart(buf)`: the earliest opener's index, 0 without one.

## Why

A DeepSeek reply on the text path showed its DSML markup character by character
until a tag closed (2026-11-04); collapsing at the prefix puts the step card up
at once and the raw markup never reaches the bubble.
