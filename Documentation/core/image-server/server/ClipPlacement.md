# ClipPlacement

`core/image-server/server/ClipPlacement.js`

Decides, per launch, whether an image model's text encoders load on the GPU or
stay on the CPU (`--clip-on-cpu`).

## Methods

- `ClipPlacement.decide({ model, cudaDevice, offloadToCpu, autoFit, requiredBytes, devices, encoderBytes?, userPinned? })`
  returns `{ clipOnCpu, note }`:
  - `clipOnCpu: undefined, note: null` when `model.launchArgs` lacks `--clip-on-cpu`;
  - `true` (keep the CPU posture) when weights are offloaded, auto-fit splits,
    `cudaDevice` is empty or names several cards, or the encoder size is unknown;
  - `false` when `userPinned` (the placement canvas pinned this card);
  - otherwise `false` only if the pinned card's room
    (`CudaDevicePicker.cardRoomBytes`, after the per-card reserve) covers
    `requiredBytes` plus the encoder bytes.
  `note` reads `text encoders on CPU: <why>` or `text encoders on GPU: <why>`,
  with sizes in GB to one decimal.
- `ClipPlacement.textEncoderBytes(model, { statSync? })` sums the sizes of the
  `t5xxl`, `clip_l`, `clip_g`, `llm` and `vision` files; unreadable files count 0.
- Statics: `GB`, `TEXT_ENCODER_KEYS`.

## Why

Flux-class catalog rows (Chroma, FLUX.2 klein) pin `--clip-on-cpu` so small
cards give the diffusion model the whole card. On a card with room that costs a
fixed CPU T5 pass per image (measured 2026-08-29: the floor of a 60 s Chroma
render), so the choice is made per launch from the real card and file sizes.
A user pin wins over the arithmetic because measured spill into WDDM shared
memory on a 5090 still ran 2.6x faster than fully resident on a 3090; offload,
auto-fit and multi-card pins are real limits and win over the pin.

`vision` is the Qwen-VL mmproj tower, which loads with the conditioner.
