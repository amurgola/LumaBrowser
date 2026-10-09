# ModelClassifier

`core/llm-server/scanner/ModelClassifier.js`

Tags a scanned model with required formats, preferred and compatible runtimes,
and MTP capability.

## Methods

- `ModelClassifier.classify(model, registry = RuntimeCatalogRegistry.shared)` returns
  `{ formatRequirements, preferredRuntimes, compatibleRuntimes, mtpCapable }`:
  - `mlx`: only `mlx-lm`;
  - add-on: the sidecar's `requiresRuntime`, else `registry.runtimesForModelKind(kind)`;
  - `mmproj-only` / `mtp-only`: no runtimes, never MTP-capable;
  - otherwise: `harmony` for `gpt-oss`; preferred = runtimes whose
    `nativeQuantPattern` matches the name, directory and weight file names
    (`runtimesPreferringQuant`); compatible = `LLAMA_CPP_RUNTIMES`
    (cuda13, cuda12, vulkan, cpu); MTP-capable when an `mtp` token appears or a
    detached head was paired. A throwing registry means no preference.
- `ModelClassifier.augmentFromGguf(model)` corrects from a parsed header: a
  `gptoss`/`gpt-oss` architecture or `gpt-oss` general name adds `harmony` once;
  a boolean `mtpGrafted` is recorded, and `true` sets `mtpCapable`.
- `LLAMA_CPP_RUNTIMES`.

## Why

Filenames lie (renamed, repacked, stripped tags); the header does not. A model
with a grafted MTP head must not also get a detached one: `-md` loads a second
copy and cost a 27B Q6_K_M its single-card fit (29.7 GB at 85 tok/s became a
2-GPU split at 55 tok/s). A `false` never clears capability, because a paired
detached head is still a valid route. Which runtime claims which quantization is
data on the runtime rows, so the scanner names none.
