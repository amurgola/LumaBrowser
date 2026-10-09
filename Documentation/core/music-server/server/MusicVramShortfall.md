# MusicVramShortfall

`core/music-server/server/MusicVramShortfall.js`

Judges whether the cards VramCoordinator reserved for music can really host
MiniMax-Music3's two stages. Used by [MusicLaunchPlanner](MusicLaunchPlanner.md).

## Methods

- `MusicVramShortfall.colocatedBytes(model)` `model.minVramBytes`, else 34 GB.
- `MusicVramShortfall.describe({ reservation, model, settingsDb, diagnostics, vramCoordinator })`
  returns why the cards cannot host the model, or null:
  - null when `core.musicServer.cudaDevice` is set (any value), when the
    coordinator has no `debitedDevices`, when it lists no cards, or on any error;
  - the target is `reservation.devices`, else the only card on a one-card box,
    else nothing (null);
  - one card: `needs about <N> GB on one GPU, <M> GB is free` when its room is
    below the colocated floor;
  - two or more: the first card must fit the AR stage (`arStageBytes`, else
    20 GB) and the second the DiT/DAV stage (`ditStageBytes`, else 13 GB):
    `the first|second GPU needs about <N> GB, <M> GB is free`.
  - Room is the coordinator's debited free VRAM (excluding `music` itself) minus
    the per-card reserve (`CudaDevicePicker.cardRoomBytes`); a card whose free
    VRAM is unreadable is not judged. GB figures are rounded with `toFixed(0)`.
- Statics: `GB`, `SERVER_ID`, `OVERRIDE_KEY`, `DEFAULT_COLOCATED_BYTES`,
  `DEFAULT_AR_STAGE_BYTES`, `DEFAULT_DIT_STAGE_BYTES`.

## Why

The coordinator's answer is necessary but not sufficient for music. On a
single-GPU box it skips the fit check because llama.cpp and sd.cpp handle RAM
fallback themselves; music has none. A two-card split is admitted on summed
room, but the stages are not divisible (a 3090 + 3060 sums to 34 GB while the
12 GB card cannot hold the 13 GB DiT stage). These are the same per-stage sizes
Automatic Setup gates on, so the two agree. An explicit device setting is the
user's escape hatch and is never second-guessed.
