# PythonEnvInstall

`core/music-server/runtimes/python-env/PythonEnvInstall.js`

One python-env runtime install, driven by
[MusicRuntimeInstaller](../MusicRuntimeInstaller.md).

## Methods

- `new PythonEnvInstall(entry, { runtimesRoot, onEvent, isCanceled })`, where
  `entry.pythonPackage` is the catalog's `{ name, version, python,
  sourceArchive?, extraPackages?, envRevision? }`.
- `execute()` resolves `{ success: true, binaryPath, manifest }` after:
  1. host: native on Linux; on win32 `Wsl.detect()` must report WSL2 and a
     visible GPU, and `$HOME` is resolved to an absolute path
     (root `$HOME/.lumabrowser`, see [PythonEnvLayout](PythonEnvLayout.md));
  2. `resolved` event ([PythonPackageSpec](PythonPackageSpec.md)`.resolvedEvent`);
  3. download the static uv tarball into `<runtimesRoot>/tools` through
     ResumableDownload (`download` events);
  4. stage uv (extract; in WSL also mkdir and chmod), `extract { phase: 'start' }`;
  5. `rm -rf <venv> && uv venv --python <python> <venv>` (10 min);
  6. `uv pip install --python <venv python> <requirement> <extras...>` (60 min),
     informative output lines as `extract { phase: 'progress', label }`, then
     `extract { phase: 'done' }`;
  7. `test -x` the `sgl-omni` entrypoint, plus `ninja` when it is an extra;
  8. `uv pip freeze` hashed to a 16-hex `freezeSha` (best-effort, else `null`);
  9. write `manifest.json` `{ id, mode, distro, venvPath, binPath, uvPath,
     package: { name, version, sourceRef, envRevision (default 1),
     extraPackages }, python, freezeSha, installedAt }`, delete the tarball,
     emit `finalize { binaryPath, manifest }`.

Failures are RuntimeInstallErrors: `WSL_NOT_READY` and `WSL_NO_GPU` (detail
`{ wsl }`), `WSL_HOME_UNRESOLVED`, `UV_SETUP_FAILED`, `VENV_FAILED`,
`PIP_INSTALL_FAILED`, `BINARY_NOT_FOUND_AFTER_INSTALL`, and `CANCELED`
(`Install canceled.`) from the download, after staging, or during a streamed step.
A throwing `onEvent` or `isCanceled` never breaks the install.

## Why

sglang-omni is CUDA/Linux-only, so on Windows every step after the download runs
inside the default WSL2 distro, and the venv lives on the distro's ext4 because
pip on `/mnt/c` is unusably slow. uv fetches CPython itself, so the host needs no
Python. Event names match the shared installer so the runtime card and setup
progress render unmodified. The venv is wiped first so a reinstall (broken env,
source-pin change) starts clean; its path is installer-authored, never user input.
The freeze hash is a reproducibility breadcrumb for bug reports.
