# AutoSetupPlan

`core/llm-server/ipc/AutoSetupPlan.js`

Automatic Local Setup's plan for this machine. Pure planning; nothing is written.

## Methods

- `new AutoSetupPlan({ llmServerService, deps, wizard, planner?, onDisk?, platform?, readDevices?, imageModels?, musicModels? })`
  (defaults `new AutoPlanner()`, a [PlannedBytesOnDisk](PlannedBytesOnDisk.md),
  `process.platform`, `CudaDeviceProbe.readDevices`, the image and music catalogs).
- `plan({ wantImage, wantMusic })` resolves `{ hardware, plan }`: the
  [ModelWizard](ModelWizard.md) budget and `AutoPlanner#plan` with the CUDA devices,
  `CuratedModelCatalog.MODELS`, the image and music catalogs (a failing read is an
  empty list) and the music eligibility. When the plan has a chat model,
  `plan.onDisk` is what is already downloaded (null when that fails).
- Music eligibility: `{ wslReady: true }` off Windows; on Windows true only when
  music is wanted and the music service's first runtime row reports WSL2 and the
  NVIDIA WSL driver.
