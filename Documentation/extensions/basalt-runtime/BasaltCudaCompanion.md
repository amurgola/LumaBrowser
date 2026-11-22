# BasaltCudaCompanion

`extensions/basalt-runtime/BasaltCudaCompanion.js`

Downloads the CUDA 13 runtime archive the core llama.cpp CUDA 13 install takes
as its companion.

## Methods

- `new BasaltCudaCompanion({ entry, runtimesRoot, emit, catalog?, http?, companions? }).fetchInto(destDir)`
  reads the first companion pattern of the `llama-cpp-cuda13` row for this host
  from core `LlmRuntimeCatalog` (ggml-org's `cudart-llama-bin-win-cuda-13...zip`
  or the Ubuntu tarball), resolves the release carrying it on that row's repo
  with core `ReleaseAssetResolver` over `GithubReleaseClient`, and installs it
  into `destDir` with core `CompanionAssets` (download, extract, outcome).
  Resolves the outcome. A host with no such companion is
  `CUDA_RUNTIME_UNAVAILABLE`. The user agent is `LlmRuntimeInstaller.USER_AGENT`.

## Why

This is the same archive, source and code path the core llama.cpp CUDA 13
install uses, so the URL source is not invented here and follows the core row
when it changes. Only the cudart archive is fetched, not a whole llama.cpp build.
