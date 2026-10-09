# DiagnosticsGatherer

`core/llm-server/diagnostics/DiagnosticsGatherer.js`

Assembles the full system diagnostics report.

## Methods

- `DiagnosticsGatherer.gather({ savedNvidiaSmiPath? })` resolves
  `{ timestamp, platform, memory, cpu, gpu, cuda, disks, budget }`:
  1. [CudaProbe](CudaProbe.md) first, so its devices can be indexed for the GPU merge;
  2. on Windows, [RegistryVramProbe](RegistryVramProbe.md);
  3. [GpuProbe](GpuProbe.md), [DiskProbe](DiskProbe.md) and
     [RamModuleProbe](RamModuleProbe.md) in parallel;
  4. on Windows, `gpu.health` from [GpuHealthProbe](GpuHealthProbe.md);
  5. `memory` from [HostProbe](HostProbe.md) with `memory.modules` set to the
     RAM module probe; `budget` from [ResourceBudget](ResourceBudget.md).

Every section is fail-soft: a missing tool yields `{ available: false, reason }`
for that section and the rest of the report is still delivered.
