# RamModuleTextParser

`core/llm-server/diagnostics/RamModuleTextParser.js`

Parses per-DIMM details from macOS `system_profiler` and Linux `dmidecode`
text.

## Methods

- `RamModuleTextParser.parseSystemProfiler(text)` one module per indented
  `BANK 0/DIMM0:` style block that has a Size or Speed; the locator comes from
  the block header, speed from `MT/s` or `MHz`.
- `RamModuleTextParser.parseDmidecode(text)` one module per `Memory Device`
  record, skipping `No Module Installed` slots. Fields are anchored at line
  start, so `Size:` never matches `Non-Volatile Size:` and `Locator:` never
  matches `Bank Locator:`.
- `RamModuleTextParser.parseSize(text)` `16 GB`, `8192 MB`, `1.5 TB`, `512 KB`
  in binary units; 0 when unreadable.

## Bugs fixed in the port

- **dmidecode records were never found.** Legacy split on a blank line
  followed by `Memory Device`, but real output always has a
  `Handle 0x..., DMI type 17` line in between, so Linux always reported zero
  modules. It now splits on the `Memory Device` line itself.
- **Most DIMM speeds read as unknown.** The "0 MT/s means unknown" check
  matched any speed ending in zero (`3200 MT/s` contains `0 MT`), so 2400,
  3200, 4800, 5600 and 6000 all became null. Only an actual 0 or `Unknown`
  does now.
