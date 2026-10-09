# ModelDirWalker

`core/llm-server/scanner/ModelDirWalker.js`

Walks a models directory breadth first and collects raw model candidates.

## Methods

- `new ModelDirWalker().walk(rootDir)` resolves `{ ggufs, addonFiles, mlxDirs, visited }`:
  - `ggufs`: `{ path, name, directory, sizeBytes, modifiedAt }` for `.gguf` (any case);
  - `addonFiles`: `{ path, name, directory, sizeBytes, defaultKind }` for `ADDON_EXTS`;
  - `mlxDirs`: Map dir -> `{ safetensors: [{ path, name, sizeBytes }], hasConfig, configPath }`
    from `*.safetensors` and `config.json`;
  - `visited`: entries seen. Unreadable directories and files are skipped.
- `MAX_DEPTH` 5, `MAX_ENTRIES` 4000, `GGUF_EXT`, `ADDON_EXTS` (`.ninfer` -> `ninfer`).

## Why

Caps keep a misconfigured root (someone pointing it at `C:\`) from locking the
scan for minutes. Add-on formats are typed later by their `.luma.json` sidecar;
a bare file still lists under its default kind so a hand-copied artifact shows up.
