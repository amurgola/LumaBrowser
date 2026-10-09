# BinaryRuntimeProbe

`core/shared/runtime/detect/BinaryRuntimeProbe.js`

Finds one binary-backed runtime on this host.

## Methods

- `new BinaryRuntimeProbe({ binaryNames, managedDir, manualBinaryPath, readVersion })`.
- `detect()` resolves the first hit of:
  1. the registered binary, if it exists: `source: 'manual'`, `managedDir` =
     its folder, `manifest: { source: 'manual', registeredAt: null }`
  2. `binaryNames` under `managedDir`, up to 3 levels: `source: 'managed'`,
     with its `manifest.json`
  3. `binaryNames[0]` on PATH: `source: 'path'`, `manifest: null`
  Each hit carries `{ installed: true, binaryPath, version, probeError }`.
  No hit: `installed: false` and `staleManualRegistration` true when a
  registered path no longer exists.

## Why

A registered binary wins because the user chose that exact file; silently
switching to a stale managed copy would be wrong.
