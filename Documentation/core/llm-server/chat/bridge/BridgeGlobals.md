# BridgeGlobals

`core/llm-server/chat/bridge/BridgeGlobals.js`

The app singletons main.js parks on `global` that the bridge reaches for, read
lazily on every call because they may arrive after the bridge.

## Methods (all static)

- `imageRouter()` (`__lumaImageRouter`), `imageServerService()`
  (`__lumaImageServerService`), `videoRouter()` (`__lumaVideoRouter`),
  `musicRouter()` (`__lumaMusicRouter`), `tabPreview()` (`__lumaTabPreview`):
  the object or null.
- `groundingAvailable()`: `__lumaVisualGrounding.isAvailable()`, false when
  absent or throwing.
