# LlmDownloadSlot

`core/llm-server/ipc/LlmDownloadSlot.js`

The one LLM model download allowed at a time (plain downloads, MLX snapshots,
add-on setups).

## Methods

- `busy` getter.
- `hold(handle)` sets the holder (`{ cancel, pause? }`); a download swaps in its live handle.
- `release()`.
- `cancel()` cancels the holder, if any.
- `pause()` pauses the holder (cancels one without `pause`): `{ success: true }`, or
  `{ success: false, error: 'No download in progress.' }`.
- `BUSY` (`A model download is already in progress.`), `IDLE`.

## Why

Two flows must never race each other for disk and bandwidth, and one Cancel or
Pause must reach whichever is running. Pause keeps the `.partial` and chunk meta,
so re-issuing the same download resumes it.
