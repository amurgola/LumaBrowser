# LlmRuntimeInstaller

`core/llm-server/runtimes/LlmRuntimeInstaller.js`

The LLM server's runtime installer: [RuntimeInstaller](../../shared/runtime/RuntimeInstaller.md)
bound to [LlmRuntimeCatalog](LlmRuntimeCatalog.md), the `LumaBrowser-LLMServer`
User-Agent and the `inference` kind.

## Methods

- `LlmRuntimeInstaller.shared` is the instance over `LlmRuntimeCatalog.shared`.
- `new LlmRuntimeInstaller({ catalog?, http?, sysdeps?, extractor? })`; all
  optional, the last three are the base's test seams.
- `LlmRuntimeInstaller.USER_AGENT` is `'LumaBrowser-LLMServer'`.
- Inherited: `installRuntime(id, { runtimesRoot, onEvent, isCanceled, channel })`,
  `uninstallRuntime(id, { runtimesRoot })`, `fetchLatestRelease(repo)`,
  `fetchLatestPrerelease(repo)`, `resolvePrerelease(id)`.

Extension-contributed runtimes (`acquisition: 'extension'`) install and
uninstall through the hooks registered in
[RuntimeCatalogRegistry](RuntimeCatalogRegistry.md); the base does that
routing. A format entry (`harmony`) fails the kind gate ("not an inference
binary") and a source-only entry (`mlx-lm`) throws `MANUAL_SOURCE_ONLY`.

## Why

The legacy module wrapped the shared factory only to route extension runtimes
through their hooks. That routing now lives in the base, so this class is
just the binding.
