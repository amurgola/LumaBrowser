# CudaPin

`core/shared/runtime/CudaPin.js`

Decides which CUDA device(s) a managed server (LLM or image) is pinned to and
applies the choice to a spawn environment. Device reads are in
[CudaDeviceProbe](CudaDeviceProbe.md); the placement policy is in
[CudaDevicePicker](CudaDevicePicker.md).

## Methods

- `CudaPin.resolveCudaDevice(settingsDb, role, { diagnostics, requiredBytes })`
  returns a `CUDA_VISIBLE_DEVICES` string (`"1"`, `"1,0"`) or `null` for the
  default all-devices behaviour. Order:
  1. The override setting for the role (`core.imageServer.cudaDevice` for
     `'image'`, else `core.llmServer.cudaDevice`) wins when set: trimmed, and an
     empty string means "never pin" (`null`). A missing or throwing settings
     store counts as unset.
  2. Fewer than two cards: `null`.
  3. Otherwise `CudaDevicePicker.pick(devices, requiredBytes)` joined by
     commas, except that a pick of every card returns `null` (identical to no
     pin, and it keeps the planner budgeting the whole box).
- `CudaPin.filterDiagnosticsToDevices(diagnostics, deviceStr)` returns a copy
  whose `cuda.devices` holds only the cards at the listed positions, so the
  launch planner sizes against the cards the child will actually see. Returns
  the original snapshot when there is no device string, no device list, no
  integer index, or the filter would leave no card.
- `CudaPin.applyCudaDeviceEnv(env, device)` sets `CUDA_VISIBLE_DEVICES` and,
  unless already set, `CUDA_DEVICE_ORDER=PCI_BUS_ID` so indices match
  nvidia-smi's. Mutates and returns `env`; a null, undefined or empty device
  leaves it untouched.
- `CudaPin.SETTING_KEYS`: `{ llm, image }` override keys.

## Why

On a multi-GPU box the LLM and the image model should not share a card: they
contend for VRAM and push each other into system RAM. llama.cpp and
stable-diffusion.cpp both spread over every visible GPU by default, so without
a pin each would also occupy the card the other wanted. Both roles use the same
"most powerful, only if free" rule, so whoever starts first on an idle box gets
the fast card and the second lands elsewhere.
