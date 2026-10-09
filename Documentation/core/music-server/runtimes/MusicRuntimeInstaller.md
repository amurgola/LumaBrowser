# MusicRuntimeInstaller

`core/music-server/runtimes/MusicRuntimeInstaller.js`

The music server's runtime installer. Extends
[RuntimeInstaller](../../shared/runtime/RuntimeInstaller.md), overriding
install and uninstall because its runtimes are python-env acquisitions (a
uv-built venv, inside WSL2 on Windows), not GitHub-release binaries.

## Methods

- `new MusicRuntimeInstaller({ catalog?, ...seams })`: `catalog` defaults to
  `new MusicRuntimeCatalog()`; User-Agent `LumaBrowser-MusicServer`, kind
  `music-inference`. Other options pass through to the base (test seams).
- `installRuntime(id, { runtimesRoot, onEvent, isCanceled })` runs one
  [PythonEnvInstall](python-env/PythonEnvInstall.md) and resolves
  `{ success: true, binaryPath, manifest }`. Refuses `Unknown runtime id: <id>`,
  `Runtime <id> is not a music inference runtime.` and
  `Runtime <id> is not python-env managed.` before any work. `channel` is ignored.
- `uninstallRuntime(id, { runtimesRoot })`: when the manifest says `mode: 'wsl'`,
  runs `rm -rf '<venvPath>'` inside the manifest's distro (120 s timeout), then
  removes `<runtimesRoot>/<id>` like the base: `{ success: true, removed: true }`
  or `{ success: true, removed: false, reason: 'Nothing to remove.' }`.
- `fetchLatestRelease`, `fetchLatestPrerelease` (inherited, unused here) and
  `resolvePrerelease(id)` (always `null`: a python-env entry has no pre-release feed).

Its test runs the shared `RuntimeInstallerContract`.

## Why

Making it a RuntimeInstaller keeps one installer interface for every server, so
the music service and IPC handlers call the same `installRuntime` /
`uninstallRuntime` as the LLM and image sides. The WSL venv lives on the
distro's ext4, outside the host-side managed dir, so it is removed separately;
the path is installer-authored, and the rm is scoped to exactly it.
