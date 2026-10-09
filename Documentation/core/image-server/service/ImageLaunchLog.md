# ImageLaunchLog

`core/image-server/service/ImageLaunchLog.js`

The one console line an image slot launch prints.

## Methods

- `ImageLaunchLog.line({ role, modelId, placement, profile, vaeTiling, cpuOnly, clipNote })`
  `[image-server] <role> model "<id>"` followed, in order, by
  ` → CUDA device <d>`, ` (auto-fit split, budgets <b>)`,
  ` (resident, VAE tiling on|OFF)` (edit-class or Wan video, not offloaded),
  ` (VAE tiling on|OFF)` (Wan video, offloaded), ` (CPU weight-offload on)`,
  ` (CPU runtime, no GPU placement)`, ` (<clipNote>)`, each only when it applies.
