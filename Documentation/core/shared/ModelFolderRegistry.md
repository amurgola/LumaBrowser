# ModelFolderRegistry

`core/shared/ModelFolderRegistry.js`

Where each model service keeps its files, so one service's scanner can step
around another's folder. Each service registers a provider for its current
folder; readers resolve lazily, so a changed setting is seen at the next scan
with no notifications.

## Methods (all static)

- `register(kind, provider)`: `kind` is `'llm'`, `'image'`, ...; `provider`
  returns the absolute path (or null). Replaces an earlier provider for the
  kind. `unregister(kind)`.
- `folderOf(kind)`: the normalized current folder, or null (unregistered, or
  the provider threw or answered nothing).
- `foldersExcept(kind)`: every other kind's current folder: what a scanner of
  `kind` must not descend into.
- `isOneOf(dir, folders)`: whether `dir` is one of `folders` after
  normalization. Children are not matched; a walker stops at the folder itself.
- `normalize(dir)`: absolute, separator-normalized, case-folded on Windows,
  no trailing separator.

Registered by [LLMServerService](../llm-server/LLMServerService.md) (`'llm'`)
and [ImageServerService](../image-server/ImageServerService.md) (`'image'`);
read by [ModelDirWalker](../llm-server/scanner/ModelDirWalker.md) through
[LlmModelsScanner](../llm-server/LlmModelsScanner.md) and by
[ImageModelsScanner](../image-server/ImageModelsScanner.md).

## Why

By default the image models live INSIDE the LLM models folder
(`<app>/models/image` under `<app>/models`) and the LLM scanner walks five
levels deep, so every diffusion GGUF, text encoder and projector of the image
library showed up in the LLM tab as a chat model (2026-10-29). A registry of
providers keeps the two services ignorant of each other and tolerant of a
folder setting that changes at runtime.
