# LlmLayoutIntent

`core/llm-server/server/launcher/LlmLayoutIntent.js`

Reads what the Advanced-tab placement layout says about the LLM.

## Methods

- `LlmLayoutIntent.read(settingsDb)` returns
  `{ noKvOffload, vramCapBytes, splitUserDrawn, placed, localDevices, remote }`:
  - `noKvOffload`: the LLM context item is enabled and placed in RAM;
  - `vramCapBytes`: the single-card VRAM cap (null with a split);
  - `splitUserDrawn`: the LLM item has user-drawn ratios over 2+ lanes;
  - `placed`: the LLM's effective resource resolves (GPU, group or RAM);
  - `localDevices`: that resource's local CUDA indices, in order;
  - `remote`: its remote refs `[{ peerId, index, ref }]`, in order.
- `LlmLayoutIntent.none()` the automatic intent (all false or empty).

An unreadable layout returns what was read before the failure.

## Why

The intent steers three later steps: overrides (KV on host, VRAM cap), peer
borrowing (remote refs are the opt-in; an explicit placement suppresses the
global toggle) and placement (only a user-drawn split owns `--tensor-split`).
