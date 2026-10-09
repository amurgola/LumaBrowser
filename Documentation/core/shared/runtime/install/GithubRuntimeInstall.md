# GithubRuntimeInstall

`core/shared/runtime/install/GithubRuntimeInstall.js`

One GitHub-release install of one runtime, start to finish. Created by
[RuntimeInstaller](../RuntimeInstaller.md) per call, so concurrent installs do
not share state.

## Methods

- `new GithubRuntimeInstall(entry, { runtimesRoot, onEvent, channel }, services)`
  where `services` is `{ catalog, userAgent, http, releaseClient, extractor, sysdeps }`.
- `execute()` resolves `{ success: true, binaryPath, manifest, sysdeps }`:
  1. host asset regex, or a typed refusal ([AcquisitionGuard](AcquisitionGuard.md))
  2. release and asset ([ReleaseAssetResolver](ReleaseAssetResolver.md)), event `resolved`
  3. download to `<root>/.tmp` ([AssetDownload](AssetDownload.md)), events `download`
  4. wipe `<root>/<id>` and extract into it, events `extract` start/done
  5. companions on top ([CompanionAssets](CompanionAssets.md))
  6. find the binary up to 3 levels deep, else `BINARY_NOT_FOUND_AFTER_EXTRACT`
  7. Linux: link shared libs beside the binary ([SharedLibLinker](SharedLibLinker.md))
  8. write `manifest.json` ([RuntimeManifest](../RuntimeManifest.md)), delete the staged archive
  9. Linux: `sysdeps.checkBinary` (warning logged when libraries are missing;
     a failing check yields `sysdeps: null`, never an error)
  10. event `finalize` with `{ binaryPath, manifest, sysdeps }`

## Why

The steps used to be one 200-line function. As a per-call object each step is
named and the shared values (release, asset, staging path) are fields instead
of locals threaded through. `sysdeps` is `null` off Linux.
