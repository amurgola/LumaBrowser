# TrainerRuntimeSpec

`extensions/lora-trainer/TrainerRuntimeSpec.js`

Data and small pure choices for the runtime.

- `SOURCE_REF`: the pinned ai-toolkit commit (main on 2026-11-16). `PYTHON` 3.12, `TORCH`
  torch 2.13.0 / torchvision 0.28.0 / torchaudio 2.11.0, as that commit's README documents.
- `sourceArchiveUrl(ref)`, `uvAsset(platform, arch)`.
- `driverCudaVersion(smiBanner)`, `torchBackend(cuda)`: `cu130` for CUDA 13 or an
  unreadable version, `cu126` for 12.6 and up, else a "driver too old" error.
- `torchIndexUrl`, `torchRequirements`, `torchConstraints(backend)`, `fingerprint()`.

## Bumping

Change `SOURCE_REF`, re-read that commit's install section for the torch pins, and bump
`REVISION` when the environment must be rebuilt without a source change.
