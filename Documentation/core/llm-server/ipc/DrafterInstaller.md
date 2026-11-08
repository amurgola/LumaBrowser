# DrafterInstaller

`core/llm-server/ipc/DrafterInstaller.js`

Downloads a catalog drafter ([DrafterCatalog](../models/DrafterCatalog.md)) into the
folder of the weights it drafts for, so the next scan pairs them and the planner
turns speculative decoding on. Behind `core.llmServer.downloadDrafter`.

## Methods

- `new DrafterInstaller({ llmServerService, slot, catalog?, pin?, download?, freeSpace? })`
  (defaults `DrafterCatalog`, `HfPinnedRepo.pin`, `ModelDownload.start`, the
  folder's free-space reader).
- `download({ id, modelPath }, send)`:
  - `ARGS_REQUIRED` without an id the catalog knows or a model path;
  - the model path must resolve inside the configured models folder and exist
    (`The model is not inside the models folder`, `Model file not found`): the
    renderer sends the path back and a drafter must never land anywhere else;
  - the busy refusal ([LlmDownloadSlot](LlmDownloadSlot.md)), then the slot is held
    before the async pin so a model download cannot race in;
  - the repo is pinned to its head sha ([HfPinnedRepo](../models/HfPinnedRepo.md)),
    the file is `DrafterCatalog.pickFile` (`NO_FILE` when the listing has no GGUF),
    the local path is built through [SafeRepoPath](../../shared/download/SafeRepoPath.md);
  - sends `start { kind: 'drafter', id, label, file, destPath, parts: 1, revision }`,
    checks the volume for the listed size minus what is already on disk
    ([FreeSpaceGuard](../../shared/download/FreeSpaceGuard.md), ` for this drafter`),
    then one [ModelTransfer](ModelTransfer.md) fetch with the listed size and sha256
    (events `download`, `verify`, `finalize` on the same `send`), then
    `done { kind: 'drafter', id, file, destPath, dir }`;
  - a cancel or pause ends with the transfer's outcome (`canceled` / `paused`).
  Resolves `{ success: true, id, file, destPath, dir }`; any throw sends
  `error { message }` and resolves `{ success: false, error }`. The slot is always released.

## Why

The drafter only pairs when it sits in the weights' folder
([GgufCompanionPairer](../scanner/GgufCompanionPairer.md)), so the destination is
the model's own directory, not a shared library like image LoRAs. The slot is the
model download's, so one Cancel reaches whichever runs and two transfers never
compete for the disk.
