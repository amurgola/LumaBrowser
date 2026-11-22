# BasaltDetector

`extensions/basalt-runtime/BasaltDetector.js`

The `detect` hook.

## Methods

- `BasaltDetector.detect({ entry, managedDir }, platform?)`: reads
  `manifest.json` (core `RuntimeManifest.read`); none, an id other than the
  row's (`entry.id`) or no `binary` is `{ installed: false }`. With [BasaltLayout](BasaltLayout.md) it checks the
  binary, the venv's Python and the CUDA 13 libraries beside the binary
  ([BasaltCudaRuntime](BasaltCudaRuntime.md)`.missingIn`); anything missing is
  `{ installed: false, manifest, error }` naming the parts. Otherwise
  `{ installed: true, source: 'managed', binaryPath, version: <release tag>, manifest }`.

## Why

A half-finished install (a failed pip step, a deleted DLL) would only fail at
launch; reading as not installed makes the Setup tab offer the install again.
The manifest id is held to the row's, so one build's install never reads as
the other's. The Blackwell check is not here: the row's `requiresHw` drives the hardware
pill, and the installer and planner refuse with the reason.
