# MediaRenderOutcome

`core/llm-server/chat/bridge/tools/media/MediaRenderOutcome.js`

The media tools' shared failure ladder after a render.

## Methods (all static)

- `failureOf(result, sink, isAborted, tool, kind)`: `stopped` after a Stop;
  the router's error (else the sink's, else `<tool> failed.`); the sink's
  error; the kind's empty message; each passed through `kind.explain`. Null on
  success. When the kind names a server (image, video), the sink saw a server
  phase (`sink.reachedServer`, see [MediaProgressSink](MediaProgressSink.md))
  and the result was not aborted by a newer request, `serverFailedNote` is
  appended on its own line, after the log tail.
- `serverFailedNote(serverName)`: `The <image|video> server failed, not the
  request: calling this tool again this turn will not help. Do not retry. Tell
  the user what failed, using the error above.`
- `images(tool)` (`returned no images.`, explained with the
  [ImageServerLogTail](ImageServerLogTail.md), server `image`), `video(tool)`
  (`returned no video.`, server `video`), `audio(tool)` (`returned no audio.`,
  no server note).

## Why

ISSUES.md entry 12: an image model that failed to load ("workspace capacity
check") came back with the error and the log tail but nothing saying a retry
was pointless, and a local chat model called generate_image four times. A load
failure, a crash or a capacity error is the server's; the routers refuse
correctable requests (a text-to-video model asked to animate an image, an
unknown model) before any server phase, so those keep their plain error and the
model can still correct its call.
