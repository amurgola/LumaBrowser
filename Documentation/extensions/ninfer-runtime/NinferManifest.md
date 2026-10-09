# NinferManifest

`extensions/ninfer-runtime/NinferManifest.js`

Reads and writes the NInfer managed dir's `manifest.json`.

## Methods

- `NinferManifest.read(managedDir)` returns the parsed manifest or `null`
  (missing or corrupt).
- `NinferManifest.write(managedDir, manifest)` writes it pretty-printed.

The manifest written by [NinferInstaller](NinferInstaller.md) holds `id`,
`mode`, `distro`, `installDir`, `binPath`, `version`, `source`
(`prebuilt` | `source-build`), `cudaDevice`, `gpuName`, `vramBytes`, `gpus`,
`installedAt`. It is the same contract as the music server's python-env
runtime: the execution mode is decided at install time and frozen here.
