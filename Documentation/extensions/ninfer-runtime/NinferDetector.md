# NinferDetector

`extensions/ninfer-runtime/NinferDetector.js`

The `detect` hook.

## Methods

- `NinferDetector.detect({ managedDir }, platform = process.platform)` resolves:
  - `{ installed: false }` without a manifest or `binPath`;
  - WSL manifest on a non-Windows host: `{ installed: false, manifest, error: 'manifest is for WSL mode' }`;
  - WSL manifest: runs `test -x <binPath>` in the distro; missing gives
    `binary missing inside WSL (<distro>): <binPath>`;
  - native: `fs.accessSync(binPath, X_OK)`; missing gives `binary missing: <binPath>`;
  - installed: `{ installed: true, source: 'managed', binaryPath, version, manifest }`.
