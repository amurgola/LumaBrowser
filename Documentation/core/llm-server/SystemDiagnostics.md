# SystemDiagnostics

`core/llm-server/SystemDiagnostics.js`

Facade over the LLM Server's system diagnostics: the hardware report the LLM
Server sizes local models from (VRAM, free RAM, free disk, CUDA availability),
plus the Windows fixes the Setup UI offers. The work lives in
`core/llm-server/diagnostics/`.

## Methods

- `SystemDiagnostics.gather({ savedNvidiaSmiPath? })` the full report; see
  [DiagnosticsGatherer](diagnostics/DiagnosticsGatherer.md).
- `SystemDiagnostics.addDirectoryToUserPath(directory)` see
  [UserPathEditor](diagnostics/UserPathEditor.md).
- `SystemDiagnostics.recoverDisplayDevice(instanceId)` see
  [DisplayDeviceRecovery](diagnostics/DisplayDeviceRecovery.md).
- `SystemDiagnostics.setPcieAspmOff()` see [PcieAspm](diagnostics/PcieAspm.md).

## The diagnostics folder

| Class | Role |
|---|---|
| [DiagnosticsGatherer](diagnostics/DiagnosticsGatherer.md) | assembles the report |
| [HostProbe](diagnostics/HostProbe.md) | platform, RAM totals, CPU |
| [RamModuleProbe](diagnostics/RamModuleProbe.md) | per-DIMM details per platform |
| [RamModuleTextParser](diagnostics/RamModuleTextParser.md) | system_profiler and dmidecode text |
| [WindowsRamModuleParser](diagnostics/WindowsRamModuleParser.md) | Win32_PhysicalMemory rows |
| [CudaProbe](diagnostics/CudaProbe.md) | nvidia-smi resolution ladder, CUDA |
| [CudaDeviceParser](diagnostics/CudaDeviceParser.md) | nvidia-smi CSV and XML |
| [GpuProbe](diagnostics/GpuProbe.md) | Chromium adapters plus VRAM and PCIe |
| [GpuAdapterMatcher](diagnostics/GpuAdapterMatcher.md) | adapter pairing and de-duplication |
| [RegistryVramProbe](diagnostics/RegistryVramProbe.md) | Windows 64-bit VRAM from the registry |
| [GpuHealthProbe](diagnostics/GpuHealthProbe.md) | Windows PnP health of display adapters |
| [PnpDisplayDevices](diagnostics/PnpDisplayDevices.md) | Display-class PnP enumeration |
| [PcieAspm](diagnostics/PcieAspm.md) | PCIe ASPM read and off |
| [DisplayDeviceRecovery](diagnostics/DisplayDeviceRecovery.md) | elevated adapter recovery |
| [DisplayRecoveryScripts](diagnostics/DisplayRecoveryScripts.md) | the recovery PowerShell |
| [UserPathEditor](diagnostics/UserPathEditor.md) | nvidia-smi dir onto PATH |
| [UserPathScripts](diagnostics/UserPathScripts.md) | the PATH PowerShell |
| [DiskProbe](diagnostics/DiskProbe.md) | volumes and free space |
| [DiskTableParser](diagnostics/DiskTableParser.md) | PowerShell, wmic and df tables |
| [ResourceBudget](diagnostics/ResourceBudget.md) | RAM and VRAM budget |
| [DiagnosticsCommand](diagnostics/DiagnosticsCommand.md) | run a probe command, never throw |
| [PowerShellRunner](diagnostics/PowerShellRunner.md) | first available PowerShell host |
| [PowerShellJson](diagnostics/PowerShellJson.md) | ConvertTo-Json rows |
| [HardwareText](diagnostics/HardwareText.md) | placeholder-aware text and numbers |

Every probe is fail-soft: a missing tool or failed syscall yields
`{ available: false, reason }` for that section and the rest of the report is
still delivered.
