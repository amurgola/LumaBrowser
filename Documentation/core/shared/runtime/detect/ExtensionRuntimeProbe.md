# ExtensionRuntimeProbe

`core/shared/runtime/detect/ExtensionRuntimeProbe.js`

Detects an extension-contributed runtime through its own `detect` hook.

## Methods

- `new ExtensionRuntimeProbe({ entry, runtimesRoot, managedDir, hooks })`.
- `detect({ cuda, gpu })` calls `hooks.detect({ entry, runtimesRoot, managedDir, cuda, gpu })`:
  - installed: `{ installed: true, source (default 'managed'), managedDir, binaryPath, version, manifest }`,
    reading `manifest.json` when the hook returns none
  - not installed: the not-installed shape plus the hook's `manifest` and
    `detectError: res.error || null`
  - throws: not installed with `detectError` = the message

## Why

An extension runtime's binary may live where fs cannot see (inside a WSL
distro) or be a wrapper script, so the hook answers instead. Fail-soft keeps
one broken extension from breaking the runtimes view.
