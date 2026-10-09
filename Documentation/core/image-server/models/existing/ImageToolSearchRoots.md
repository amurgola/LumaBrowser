# ImageToolSearchRoots

`core/image-server/models/existing/ImageToolSearchRoots.js`

Where to look for other image tools' installs. These tools are git clones and
portable zips dropped anywhere, so discovery is a shallow look at the places
people put them, never a deep walk of a drive.

## Methods

- `searchParents()` returns existing folders whose direct children get a name
  check: home and its `Documents`, `Desktop`, `Downloads`, `OneDrive/Documents`,
  `AI`, `ai`, `comfy`; on Windows every drive root C to Z plus its `AI`,
  `StableDiffusion` and `SD` folders.
- `stabilityMatrixRoots(env)` returns existing Stability Matrix data dirs
  (`%APPDATA%/StabilityMatrix`, and `~/.config/StabilityMatrix` off Windows).
- `comfyConfiguredRoots(env, installDirs)` returns existing roots named by
  ComfyUI Desktop's `config.json` `basePath` (APPDATA, or macOS Application
  Support) and by every `base_path:` line of each install's
  `extra_model_paths.yaml` and the desktop `extra_models_config.yaml`. Relative
  paths resolve against the YAML file's folder.

## Why

ComfyUI Desktop keeps its real base path in its own config, and any ComfyUI can
point at an A1111 library through `extra_model_paths.yaml`; both are just
another root to probe. One regex reads `base_path` because a YAML parser for one
key would be a dependency for nothing.
