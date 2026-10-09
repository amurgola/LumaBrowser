# StatusText

`core/llm-server/ui/js/chat/stream/StatusText.js`

The pending-bubble lines for server work before the model speaks, and the
compaction pill's text.

## Methods

- `StatusText.forPhase(phase)`: `switching-model`, `starting-server`,
  `loading-vision`, `unloading-vision`, `compacting`, `waiting-for-slot`
  ("Waiting for processing..."), else "Working...".
- `StatusText.COMPACTED`, `StatusText.compactedTitle(removed)`.
