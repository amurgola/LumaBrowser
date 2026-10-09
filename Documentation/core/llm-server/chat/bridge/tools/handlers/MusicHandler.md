# MusicHandler

`core/llm-server/chat/bridge/tools/handlers/MusicHandler.js`

`generate_music`: composes a song and stores it as an audio artifact. A
[ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, params, ctx)`: needs `BridgeGlobals.musicRouter()`, `lyrics` and
  `style_description`; `router.generate({ lyrics, instructions, durationSec,
  seed, send })` with an `elapsed` [MediaProgressSink](../media/MediaProgressSink.md);
  failures through [MediaRenderOutcome](../media/MediaRenderOutcome.md)`.audio`;
  stores the WAV and returns `Song "<title>" (Ns) is now playable ...`. Title:
  the param, the first lyric line, or `Generated song`.
- `MusicHandler.firstLyricLine(lyrics)`: first non-empty line that is not a
  `[tag]`, clipped to 60, or null.
