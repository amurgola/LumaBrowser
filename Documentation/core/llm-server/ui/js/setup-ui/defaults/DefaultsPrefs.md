# DefaultsPrefs

`core/llm-server/ui/js/setup-ui/defaults/DefaultsPrefs.js`

The Defaults settings outside the launch payload (auto-unload, unload on VRAM pressure, the low-VRAM warning, GPU headroom bytes, tool approval, RAM-pin status), cached so a re-render never redraws one as unset.

## Methods

- Fields `autoUnloadMs`, `unloadOnVramPressure`, `vramWarning` (`getVramWarning().enabled`, null without the getter), `gpuHeadroomBytes`, `approvalPolicy`, `ramPinStatus`.
- `load(api)`: each read best-effort; a missing getter leaves its row out; a failed RAM-pin read keeps the last status. `ramPinSupported()`, `policyFrom(r)`, `AUTO_UNLOAD_MS` (15 min).

## Globals

None.

## Changes (2026-11-22, framework refactor)

`loadRamPin(api)` reads only the RAM pin status; `load` calls it. The Frameworks card calls it before its first paint, since its RAM pin row needs `ramPinSupported()` and it paints before the Chat defaults card. One instance is shared on the context as `ctx.prefs`.
