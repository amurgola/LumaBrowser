# SysdepsChecker

`core/shared/runtime/SysdepsChecker.js`

Linux system-library preflight for the managed runtimes. Reports which
Debian/Ubuntu packages are missing, as a plain sentence plus a copyable
`sudo apt install` line, without ever surfacing linker output to the user.

## Methods

- `new SysdepsChecker({ exec, platform, fileExists, libDirs })` all optional.
  `exec(cmd, args, opts)` defaults to `SysdepsCommandRunner.run`; `platform`
  defaults to `process.platform`; `fileExists` to a non-throwing
  `fs.existsSync`; `libDirs` to `COMMON_LIB_DIRS`. The seams keep tests
  hermetic on any host.
- `checkKnownLibs()` checks `KNOWN_LIBS` via `ldconfig -p`, falling back to
  probing `libDirs` when ldconfig is unavailable. Result carries
  `method: 'ldconfig' | 'probe'`. Runs before any model download.
- `checkBinary(binaryPath)` runs `ldd` on an installed runtime binary and
  reports every "not found" soname, mapped through `LDD_PACKAGE_MAP` (a string
  is the apt package; `{ hint }` names a vendor runtime that is no apt package)
  and then `LDD_FAMILY_HINTS` (regexes for the ROCm, oneAPI and Intel NPU
  driver families, each with a hint). Unmapped ones keep `pkg: null`; a hinted
  one carries `hint` beside `pkg: null`, so it reads in the message but stays
  out of the apt line. Result carries `method: 'ldd'` and
  `binaryPath`; `rawLog` is the ldd output capped at `RAW_LOG_LIMIT` (4000).
  If ldd fails with no output, returns a not-applicable result with
  `skipped: 'ldd-failed: ...'`; an empty path gives `skipped: 'no-binary'`.
- `preflight({ binaries })` runs `checkKnownLibs` plus `checkBinary` on each
  truthy binary and merges them, so the caller shows one apt line.
- Statics: `KNOWN_LIBS`, `LDD_PACKAGE_MAP`, `LDD_FAMILY_HINTS`, `COMMON_LIB_DIRS`,
  `RAW_LOG_LIMIT`.

Every method resolves the shape built by `SysdepsReport`:
`{ ok, platform, missing: [{ soname, pkg }], packages, aptLine, message, rawLog, ... }`.
On a non-Linux platform every method resolves `ok: true, skipped: 'not-linux'`
without running anything.

## Why

A fresh Ubuntu 24.04 lacks libgomp1 (llama.cpp, sd.cpp), libnss3 and libnspr4
(the browser engine) and libasound2 (voice mode). Without them a runtime binary
fails at dlopen time, possibly after a 37 GB model download, and the only
feedback used to be raw linker text cached as the runtime's version label.

`message` is what the UI shows; `rawLog` is for the log only. The IPC handler
strips `rawLog` before replying to a renderer.

`ldd` runs with the binary's directory first on `LD_LIBRARY_PATH` and as cwd,
matching the launcher, because the installer places the runtime's own `.so`
files next to the binary and those must not count as missing.

`libasound2t64` is the 24.04 (time64) package name; the .deb's
`| libasound2` alternative covers older releases.

The hints exist because upstream's Linux ROCm and SYCL tarballs ship none of
their vendor runtime: a SYCL install on a bare host lists a dozen oneAPI
sonames, and "sudo apt install libsycl.so.8" would be nonsense. The OpenCL ICD
loader, Level Zero loader and GPU driver are real packages and map as such.
