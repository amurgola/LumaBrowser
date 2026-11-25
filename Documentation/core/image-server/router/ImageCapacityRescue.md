# ImageCapacityRescue

`core/image-server/router/ImageCapacityRescue.js`

Turns a render that ran out of room on its card into a measurement. When
sd-server's newest log lines carry sd.cpp's out-of-room failure, the model is
recorded as needing more than the VRAM budget it launched with, in the store the
placement test renders write
([MeasuredFootprintStore](../../placement/service/MeasuredFootprintStore.md)),
and its slot is stopped. [ImageRouter](../ImageRouter.md) then tries the render
once more, and the new launch is placed with the real need: on a card that holds
it, or with the chat model swapped out ([ChatSwapOut](../service/ChatSwapOut.md)).

## Methods

- `new ImageCapacityRescue({ getSettingsDb, log })`.
- `async prepare(server, modelId, since?)`: true when the failure was out of room, the
  slot launched with a `--max-vram` budget, the need was recorded and the slot
  stopped; false (nothing changed) otherwise, or when the stop throws.
- `ImageCapacityRescue.ranOutOfRoom(server, since?)`: a log entry of the render
  (entries with `ts >= since`; without `since`, the newest 40) matches `SIGNATURE`.
  Entries are the log ring's `{ ts, stream, line }` (a bare string is read as a
  line). The signature covers "failed during weight preparation", a workspace preparation,
  allocation or capacity check, an output cache allocation, "out of memory" or
  "cudaMalloc failed".
- `ImageCapacityRescue.neededBytes(server)`: the launch budget
  (`server.plan.maxVram`) plus 1 GiB, or null without one.
- `ImageCapacityRescue.budgetBytes(text)`: `"cuda0=18.1,cuda1=4.5"` (GiB per card)
  to total bytes.

The record keeps a larger stored measurement (`peakVramBytes` only grows) and is
marked `vramApprox: true, source: 'capacity-failure'`.

## Why

A model never measured is placed by its declared floor. Qwen-Image 2.1 edits
declare 12 GB, but the Qwen3-VL vision pass over the input picture needs more:
placed beside Anima on a 3090, sd.cpp split the pass into segments and failed
"qwen3vl segment 2/30 ... failed during weight preparation" (2026-11-25). The
budget alone does not help: sd.cpp streams weights from RAM only for weights kept
off the card (`--offload-to-cpu`). Learning the need from the failure and placing
again sends the edit to a card that holds it, as the user's automatic flow asks.
