# ImageLaunchInputs

`core/image-server/service/ImageLaunchInputs.js`

Resolves and checks what an image launch needs before any port or VRAM is
touched.

## Methods

- `new ImageLaunchInputs({ runtimeDetector, scanner })`.
- `ImageLaunchInputs.defaultsRefusal(runtimeId, modelId)` `No default image runtime selected.`,
  `No default image model selected.` or `null`.
- `runtime({ runtimeId, runtimesRoot, diagnostics, manualBinaries })` calls
  `detectRuntimes({ runtimesRoot, cuda, gpu, manualBinaries })`; resolves
  `{ runtime }` or `{ error }`: `Image runtime <id> not found.`,
  `Image runtime <name> is not installed.`, `Image runtime <name> has no usable binary.`
- `model({ modelId, modelsDir })` resolves `{ model }` (the scanned record) or
  `{ error: 'Image model "<id>" not found in <dir>.' }`.
- `ImageLaunchInputs.apiKeyRefusal(apiKeyInfo)` `NO_API_KEY` when keys are
  required and none exist, else `null`.

## Why

The real manual-binary map must reach the detector: legacy bug H2 passed `{}`,
so a located sd-server showed as registered while every generation failed with
"not installed". The API-key check fails closed because the auth proxy would
answer 401 to every caller.
