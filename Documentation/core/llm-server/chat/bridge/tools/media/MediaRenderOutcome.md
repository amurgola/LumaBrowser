# MediaRenderOutcome

`core/llm-server/chat/bridge/tools/media/MediaRenderOutcome.js`

The media tools' shared failure ladder after a render.

## Methods (all static)

- `failureOf(result, sink, isAborted, tool, kind)`: `stopped` after a Stop;
  the router's error (else the sink's, else `<tool> failed.`); the sink's
  error; the kind's empty message; each passed through `kind.explain`. Null on
  success.
- `images(tool)` (`returned no images.`, explained with the
  [ImageServerLogTail](ImageServerLogTail.md)), `video(tool)` (`returned no
  video.`), `audio(tool)` (`returned no audio.`).
