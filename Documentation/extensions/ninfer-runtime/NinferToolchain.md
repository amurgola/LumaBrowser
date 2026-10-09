# NinferToolchain

`extensions/ninfer-runtime/NinferToolchain.js`

Checks whether a NInfer source build can run.

## Methods

- `NinferToolchain.check(mode, distro, managedDir?)` writes the probe script
  (into `managedDir`, else a temp dir), runs it through [NinferShell](NinferShell.md)
  and resolves `parseOutput(stdout)`, plus `probeError` (stderr, max 300 chars)
  when the probe failed and printed nothing.
- `NinferToolchain.parseOutput(stdout)` returns `{ ok, missing, found }`.
  `missing` names, in order: `CUDA Toolkit 13.1+ (nvcc)`, `cmake 3.28+`,
  `g++ (C++20)`, `ninja-build`, `git`, `pkg-config`, the FFmpeg dev libs,
  `libcurl4-openssl-dev`. CRLF output parses; empty output lists all eight.
