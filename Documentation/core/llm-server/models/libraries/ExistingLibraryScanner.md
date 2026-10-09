# ExistingLibraryScanner

`core/llm-server/models/libraries/ExistingLibraryScanner.js`

Finds GGUF models the user already has in other local-AI tools so setup can
adopt them instead of re-downloading multi-gigabyte files.

## Methods

- `ExistingLibraryScanner.scan({ modelsDir, env })` returns
  `{ models, sources }`:
  - `models` are `{ source, sourceLabel, name, file, path, bytes, id, realPath }`
    from [LmStudioSource](LmStudioSource.md), [HfCacheSource](HfCacheSource.md)
    and [OllamaSource](OllamaSource.md), in that order, then sorted largest first;
  - `id` is the lower-cased real path; a file reached twice (a symlinked cache,
    an earlier adoption link) is listed once, first source wins;
  - anything inside `modelsDir` (the app's own library, by resolved path) is left out;
  - `sources` counts models per source id (`{ lmstudio: 2, ollama: 1 }`).
  - `env` defaults to `process.env`. Never throws.
- `ExistingLibraryScanner.MIN_MODEL_BYTES` (64 MB) and `SOURCES`.

## Why

These three sources cover essentially every user who arrives with models on
disk. The app library is excluded by resolved path, not by root, because a user
can point a tool at it. Adoption itself is [ExistingModelImporter](ExistingModelImporter.md).
