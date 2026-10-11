# DiagnosticsGatherer

`core/llm-server/diagnostics/DiagnosticsGatherer.js`

Assembles the full system diagnostics report.

## Methods

- `DiagnosticsGatherer.gather({ savedNvidiaSmiPath?, runtimesRoot? })` resolves
  `{ timestamp, platform, memory, cpu, gpu, npu, cuda, disks, budget }`;
  `runtimesRoot` is where managed runtimes install:
  1. [CudaProbe](CudaProbe.md) first, so its devices can be indexed for the GPU merge;
  2. on Windows, [RegistryVramProbe](RegistryVramProbe.md);
  3. on Linux, [LinuxDrmVramProbe](LinuxDrmVramProbe.md) (synchronous sysfs reads);
  4. [GpuProbe](GpuProbe.md) (given the CUDA indexes, registry rows and sysfs
     rows), [DiskProbe](DiskProbe.md), [RamModuleProbe](RamModuleProbe.md) and
     [NpuProbe](NpuProbe.md) in parallel (a rejected NPU probe becomes
     `{ available: false, reason }`);
  5. on Linux, only when a discrete Intel or AMD adapter still has no VRAM
     (an integrated one is sized from RAM in step 7, so an iGPU-only laptop
     never spawns a build on a refresh), [LlamaDeviceProbe](LlamaDeviceProbe.md)
     against `runtimesRoot` and [LlamaDeviceVram](LlamaDeviceVram.md)`.apply`
     (a failure is ignored);
  6. `memory` from [HostProbe](HostProbe.md) with `memory.modules` set to the
     RAM module probe;
  7. shared GPU memory: [UnifiedMemoryProbe](UnifiedMemoryProbe.md) on Apple
     Silicon, then [SharedGpuMemory](SharedGpuMemory.md)`.apply` with the RAM
     total and CUDA availability, which may rewrite the GPU summary;
  8. on Windows, `gpu.health` from [GpuHealthProbe](GpuHealthProbe.md), on the
     final summary;
  9. `budget` from [ResourceBudget](ResourceBudget.md).

Every section is fail-soft: a missing tool yields `{ available: false, reason }`
for that section and the rest of the report is still delivered.

## Why

The llama.cpp device list runs only when needed because it spawns a
`llama-server`; on Linux it is the only VRAM figure for Intel cards. The
shared-memory step runs after it, so a real figure wins, and after the memory read because both the unified
working set and an integrated GPU's share are sized from total RAM. Before it,
only nvidia-smi and the Windows registry supplied VRAM, so Macs, Linux AMD and
Intel cards, and Windows integrated GPUs planned against 0 bytes and launched
with `-ngl 0`.
