# CudaProbe

`core/llm-server/diagnostics/CudaProbe.js`

Detects NVIDIA GPUs and CUDA through nvidia-smi, finding the binary even when
it is not on PATH.

## Methods

- `CudaProbe.probe({ savedNvidiaSmiPath? })` resolves either
  `{ available: false, reason, pathHint, discoveredPath }` or
  `{ available, cudaVersion, devices, pathHint, discoveredPath }`
  (`available` is true when at least one device was listed; devices from
  [CudaDeviceParser](CudaDeviceParser.md)).

## Resolution ladder

1. The saved path from a previous discovery (reboots skip rediscovery and the
   PATH banner).
2. Bare `nvidia-smi` on PATH.
3. Only if the binary is missing (not merely failing):
   [NvidiaSmi](../../shared/runtime/NvidiaSmi.md)`.findOnDisk()`.

The winner is published with `NvidiaSmi.setSmiPath(usedPath)` (null when bare
PATH worked, so NvidiaSmi falls back to the bare name). This class is the
producer of that path: cudaPin, the fit tester and everything downstream used
to shell out to the bare name and failed silently on exactly the hosts this
ladder exists for.

`pathHint` (`{ foundAt, directory, powershellCommand, canApplyAutomatically }`)
appears only when PATH lookup failed but an absolute path works; the UI then
offers to add the directory to PATH ([UserPathEditor](UserPathEditor.md)).
`discoveredPath` is what the caller persists as the saved path. The CUDA
version is read with the binary already verified, so it cannot retrigger the
PATH fallback.
