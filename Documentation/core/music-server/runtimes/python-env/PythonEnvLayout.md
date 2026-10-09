# PythonEnvLayout

`core/music-server/runtimes/python-env/PythonEnvLayout.js`

Where a python-env runtime's pieces live, natively or inside WSL.

## Methods

- `new PythonEnvLayout({ mode, runtimesRoot, id, wslRoot })`, `mode` is
  `'wsl'` or `'native'`; `wslRoot` is required in wsl mode.
- Getters: `mode`, `isWsl`, `managedDir` (`<runtimesRoot>/<id>`), `toolsDir`
  (`<runtimesRoot>/tools`, host side), `uvTarball` (`<toolsDir>/uv-linux.tar.gz`),
  `wslToolsDir` (`<wslRoot>/tools`), `wslRuntimeDir` (`<wslRoot>/runtimes/<id>`),
  `uvPath`, `venvPath`, `pythonPath`, `binPath` (`venv/bin/sgl-omni`).
  - native: uv at `<toolsDir>/uv`, venv at `<managedDir>/venv`.
  - wsl: uv at `<wslRoot>/tools/uv`, venv at `<wslRoot>/runtimes/<id>/venv`
    (POSIX paths).
- `venvBin(name)` is `<venv>/bin/<name>`.
- `PythonEnvLayout.wslRootFor(homeDir)` is `<homeDir>/.lumabrowser`.
- `PythonEnvLayout.uvDownloadUrl(arch = process.arch)` is the GitHub
  `releases/latest/download` URL for `aarch64` (arm64) or `x86_64` Linux uv.

## Why

The WSL venv sits on the distro's ext4 filesystem because pip on `/mnt/c` is
unusably slow; the uv tarball still downloads on the host side and is extracted
from its `/mnt/...` path. `$HOME` must be absolute because every path lands in
single quotes, where `~` never expands. `latest/download` is a stable redirect,
so uv needs no pin of its own.
