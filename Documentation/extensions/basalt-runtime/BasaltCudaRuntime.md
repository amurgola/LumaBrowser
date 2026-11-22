# BasaltCudaRuntime

`extensions/basalt-runtime/BasaltCudaRuntime.js`

Puts the CUDA 13 runtime libraries Basalt loads beside its binary.

## Methods

- `new BasaltCudaRuntime({ runtimesRoot, managedDir, binDir, emit, fetchCompanion, platform? }).install()`
  resolves `{ source, files }`:
  - `present`: every library already in `binDir`;
  - `llama-cpp-cuda13`: copied from `<runtimesRoot>/llama-cpp-cuda13` (searched
    three levels deep) when all three are there;
  - `download`: `fetchCompanion(<managedDir>/cuda13-download)` (the installer
    passes [BasaltCudaCompanion](BasaltCudaCompanion.md)), then copied; the
    download folder is removed either way. An archive without all three is
    `CUDA_RUNTIME_INCOMPLETE`.
- `BasaltCudaRuntime.missingIn(dir, platform?)`: the library patterns with no
  file directly in `dir` (the detector's check).
- `LIBRARY_PATTERNS`: Windows `cudart64_13.dll`, `cublas64_13.dll`,
  `cublasLt64_13.dll`; Linux `libcudart.so.13*`, `libcublas.so.13*`,
  `libcublasLt.so.13*`.

## Why

The release ships no CUDA libraries and wants cudart and cuBLAS on `PATH`.
Core's spawn environment (`RuntimeSpawnEnv`) makes the binary's folder the
child's working directory and the first `PATH` entry (and `LD_LIBRARY_PATH` on
Linux), and a runtime's extra environment cannot replace an existing `PATH`, so
the libraries go beside `basalt.exe`: the engine, its Python server and the
vision sidecar all inherit that. Copies (about 0.7 GB on Windows) rather than
links, so reinstalling or removing llama-cpp-cuda13 never breaks Basalt.
`copyFile` follows links, so a Linux `.so.13` symlink lands as a real file.
