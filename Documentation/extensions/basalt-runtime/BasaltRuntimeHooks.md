# BasaltRuntimeHooks

`extensions/basalt-runtime/BasaltRuntimeHooks.js`

The hook object registered with each Basalt runtime row.

## Methods

- `BasaltRuntimeHooks.hooks()` returns `{ detect, install, planLaunch }`,
  delegating to [BasaltDetector](BasaltDetector.md)`.detect`,
  [BasaltInstaller](BasaltInstaller.md)`.install` and
  [BasaltLaunchPlanner](BasaltLaunchPlanner.md)`.plan` (synchronous). Both
  rows get the same hooks: core passes the row (`entry`) to `detect` and
  `install`, and that says which build is meant.

## Why

No `uninstall` hook: core's `RuntimeInstaller.uninstallRuntime` removes the
managed dir when a row has none, and that dir holds everything the install
wrote (archive, venv, CUDA libraries, manifest).
