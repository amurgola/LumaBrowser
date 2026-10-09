# WindowsRamModuleParser

`core/llm-server/diagnostics/WindowsRamModuleParser.js`

Maps `Win32_PhysicalMemory` rows to the RAM module shape.

## Methods

- `WindowsRamModuleParser.parseRows(rows)`: capacity, speed, configured speed,
  cleaned vendor, part number and locator; form factor and memory type decoded
  through `FORM_FACTORS` and `MEMORY_TYPES`. The type uses `SMBIOSMemoryType`
  (modern, e.g. 34 = DDR5) and falls back to the legacy `MemoryType`, which is
  often 0 on newer hardware.
