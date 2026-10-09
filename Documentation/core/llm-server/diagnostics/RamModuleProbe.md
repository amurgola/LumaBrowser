# RamModuleProbe

`core/llm-server/diagnostics/RamModuleProbe.js`

Per-DIMM RAM details: speed, capacity, type, slot and vendor. CPU inference
is bandwidth-bound, so DDR5-6000 and DDR4-2400 at the same channel count give
very different tokens per second.

## Methods

- `RamModuleProbe.probe()` resolves `{ available, source?, modules, reason? }`.
  - Windows: `Get-CimInstance Win32_PhysicalMemory` (no elevation), mapped by
    [WindowsRamModuleParser](WindowsRamModuleParser.md); source
    `win32_physicalmemory`. No rows gives `{ available: true, modules: [] }`
    (no source; legacy shape kept).
  - macOS: `system_profiler SPMemoryDataType`, source `system_profiler`.
  - Linux: `dmidecode -t 17`, source `dmidecode`. It usually needs root; a
    permission error becomes `dmidecode requires elevated privileges (sudo) to
    read SMBIOS; RAM speed unavailable`.
  - Text parsing is [RamModuleTextParser](RamModuleTextParser.md). Any throw
    becomes `{ available: false, reason, modules: [] }`.

Module shape: `{ capacityBytes, speedMTs, configuredSpeedMTs, manufacturer,
partNumber, deviceLocator, formFactor, memoryType }`.
