# IterationStream

`core/llm-server/chat/bridge/turn/IterationStream.js`

The content-token handler for one completion.

## Methods

- `new IterationStream({ hooks, mirror, allows })`; `onToken(token)` (bound):
  buffers; the first time the buffer holds ```` ```tool ```` or an XML opener,
  suppresses the iteration on the [StreamMirror](StreamMirror.md) and starts the
  [PendingToolCard](PendingToolCard.md) at the call's start; while suppressed,
  keeps the card updated; mirrors the token otherwise; feeds the
  [ArtifactStreamPreview](ArtifactStreamPreview.md).
