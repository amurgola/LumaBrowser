# HardwareText

`core/llm-server/diagnostics/HardwareText.js`

Normalises text and numeric fields printed by hardware tools.

## Methods

- `HardwareText.clean(value)` trims; `null` for empty text or SMBIOS
  placeholders (`Unknown`, `Not Specified`, `None`, `To Be Filled...`).
- `HardwareText.numberOrNull(value)` `Number(value)` when finite, else `null`.
  An empty string reads as 0 (legacy behaviour kept); `[N/A]` reads as null.
