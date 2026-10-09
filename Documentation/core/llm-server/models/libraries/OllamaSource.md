# OllamaSource

`core/llm-server/models/libraries/OllamaSource.js`

Ollama's model store. Extends [LibrarySource](LibrarySource.md).

## Members

- `id` `'ollama'`, `label` `'Ollama'`.
- `roots()`: `OLLAMA_MODELS` when set, else `~/.ollama/models`.
- `scan()` walks `manifests/` (up to 5 levels), reads each manifest's layer whose
  `mediaType` ends in `image.model`, and maps its digest `sha256:<hex>` to the
  blob `blobs/sha256-<hex>`. Each model is named `<name>:<tag>` from the manifest
  path (`manifests/<registry>/<namespace>/<name>/<tag>`) and given the file name
  `<name>-<tag>.gguf` (non-word characters replaced by `-`). Unparseable
  manifests, manifests without a weights layer, and missing or stub-sized blobs
  are skipped.

## Why

Ollama blobs are content-addressed and have no extension, so a plain `*.gguf`
walk finds nothing; the manifests are what name them. The `.gguf` file name is
what the adoption link is called so the models scanner recognises it.
