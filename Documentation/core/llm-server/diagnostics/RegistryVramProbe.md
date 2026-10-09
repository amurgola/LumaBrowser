# RegistryVramProbe

`core/llm-server/diagnostics/RegistryVramProbe.js`

Reads each Windows display adapter's 64-bit VRAM from the display-class
registry keys (`HardwareInformation.qwMemorySize`, falling back to
`HardwareInformation.MemorySize`).

## Methods

- `RegistryVramProbe.probe()` resolves rows `{ DriverDesc, ProviderName,
  MemBytes }`, `[]` when there are none, or `null` when PowerShell failed or
  the output was not JSON.

## Why

`Win32_VideoController.AdapterRAM` is a 32-bit DWORD that clamps at 4 GB,
useless for any modern card; the driver also writes the exact 64-bit value to
the registry.
