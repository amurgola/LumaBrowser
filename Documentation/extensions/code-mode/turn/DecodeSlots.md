# DecodeSlots

`extensions/code-mode/turn/DecodeSlots.js`

The fan-out budget for dispatch_batch.

## Methods (static)

- `count(service = ExtensionGlobals.llmServerService())` -> the floored
  `getDefaults().maxConcurrent` (the server's `--parallel`), or 1 when missing,
  below 1 or throwing.
