# ContextLadder

`core/llm-server/context/ContextLadder.js`

The context rungs the chat picker and the fit test share.

## Methods

- `ContextLadder.RUNGS` `[8192, 16384, 32768, 65536, 131072, 262144]` (frozen).
- `ContextLadder.LABELS` `8k` to `256k` for the rungs.
- `ContextLadder.label(tokens)` the rung label, else `round(tokens / 1024)k`
  (`40000` -> `39k`; junk -> `0k`).
- `ContextLadder.rungsFor(nativeCtx)` rungs at or below the native context; no
  native context gives every rung; a native context below 8192 gives `[nativeCtx]`.

## Why

The fit tester sweeps the same rungs with the same clamp, so a persisted fit row
always lands on a rung by `contextTokens`.
