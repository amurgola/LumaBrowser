# NinferScripts

`extensions/ninfer-runtime/NinferScripts.js`

The bash scripts the NInfer installer runs and the writer that puts them on disk.

## Methods

- `NinferScripts.write(managedDir, name, body, mode)` writes `body` (CRLF to LF,
  mode 0755) to `<managedDir>/<name>` and returns the path the execution
  environment sees (`/mnt/<drive>/...` in WSL mode).
- `NinferScripts.buildScript(src, work, installDir)` returns the step script:
  `clone` (fresh clone of `src.repo`, checkout `src.commit`), `build` (cmake +
  Ninja Release), `pack <wrapper>` (copies ninfer-serve, ninfer-cli and
  libcudart.so.13 into `installDir`, installs the wrapper as
  `installDir/ninfer-serve`, writes `COMMIT`). Paths are POSIX single-quoted.
- Statics: `PATH_PREFIX`, `TOOLCHAIN_PROBE` (prints `nvcc=`, `cmake=`, `gxx=`,
  `ninja=`, `git=`, `pkgconfig=`, `ffmpeg=`, `curl=` lines), `WRAPPER` (sets
  `LD_LIBRARY_PATH` to the bundled lib dir and execs `bin/ninfer-serve`).

## Why

Commands with nested quoting do not survive the wsl.exe command line intact (a
`grep -o "..."` inside `$(...)` came back empty in the app), so anything beyond
simple quoted words runs from a file. `PATH_PREFIX` exists because a
non-interactive login shell under wsl.exe has neither `~/.local/bin` nor the
CUDA toolkit on its PATH.
