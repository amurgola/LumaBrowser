# ImageToolInstallProbe

`core/image-server/models/existing/ImageToolInstallProbe.js`

Decides by folder structure whether a directory is an install of another image
tool, and which checkpoint folders it holds.

## Methods

- `probe(dir)` returns `{ tool, dir, name, folders: [{ dir, allInOne }] }` or
  `null`. It looks in `dir`, then `ComfyUI/`, `webui/` and `Data/` beneath it
  (portable zips nest the real tree), for a `models` / `Models` folder holding:
  - `StableDiffusion`: `stabilitymatrix`
  - `Stable-diffusion`: `forge`, `sdnext` (automatic, sd.next), `swarmui`, or
    `a1111`, by the folder name
  - `checkpoints`: `fooocus` or `comfyui`, plus `diffusion_models` and `unet`
    as UNet-only folders (`allInOne: false`)

  The first match names the tool; every matching folder is listed. The result
  `dir` is the base where `models` was found; `name` is the probed folder's name.
- `plainFolder(dir)` is the record for a user-picked folder that is not an install.
- `labelFor(tool)` and `TOOL_LABEL` give the display name (falls back to the id).
