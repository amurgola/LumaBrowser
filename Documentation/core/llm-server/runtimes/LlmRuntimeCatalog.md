# LlmRuntimeCatalog

`core/llm-server/runtimes/LlmRuntimeCatalog.js`

The LLM server's runtime catalog: the declared runtimes
([LlmRuntimeDeclarations](LlmRuntimeDeclarations.md)) plus the ones extensions
registered in [RuntimeCatalogRegistry](RuntimeCatalogRegistry.md), merged at
read time. Extends [RuntimeCatalog](../../shared/runtime/RuntimeCatalog.md).

## Methods

- `LlmRuntimeCatalog.shared` is the instance over `RuntimeCatalogRegistry.shared`.
- `new LlmRuntimeCatalog(registry?, runtimes?)` (defaults: the shared registry
  and the declarations) for tests and isolated use.
- `getCatalog()` returns the declarations, concatenated with the registry's
  entries when there are any.
- `getById(id)` prefers a declared row, then a registered one, else `null`.
- `fingerprint()` is the declarations' 16-hex hash, plus `+<8 hex>` over the
  registered entries when there are any.
- `getExtensionHooks(id)` returns the registry's hooks (`detect`, `install`,
  `uninstall`, `planLaunch`) or `null`.
- `cudaRuntimePreference(cudaVersion)` returns
  `['llama-cpp-cuda13', 'llama-cpp-cuda12']` for a driver reporting CUDA 13 or
  newer, else `['llama-cpp-cuda12']`.
- Inherited: `platformKey`, `getAssetPattern`, `getRepo`,
  `getCompanionAssetPatterns`, `getBinaryNames`.

## Why

The static rows stay a plain array and every consumer that goes through
`getCatalog`/`getById` sees extension runtimes too, mirroring the image catalog.
The fingerprint folds registered rows in, otherwise the persisted runtimes view
would keep serving the pre-registration list after an extension activates.

A CUDA 13 driver (R580+) prefers the CUDA 13 build for its native Blackwell
(sm_120) kernels; the CUDA 12 build JIT-compiles PTX on RTX 50-series cards.
