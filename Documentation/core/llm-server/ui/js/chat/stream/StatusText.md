# StatusText

`core/llm-server/ui/js/chat/stream/StatusText.js`

The pending-bubble lines for server work before the model speaks, and the
compaction pill's text.

## Methods

- `StatusText.forPhase(phase)`: `switching-model`, `starting-server`,
  `rendering-image` ("Generating the image..."), `rendering-video`
  ("Rendering the video...", both sent by the media routers once the slot is up),
  `loading-vision`, `unloading-vision`, `compacting`, `waiting-for-slot`
  ("Waiting for processing..."), `retrying` ("Reconnecting to the model...",
  the agent completion's transient-failure retry), else "Working...".
- `StatusText.COMPACTED`, `StatusText.compactedTitle(removed)`.
