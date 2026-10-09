# DefaultsPrefs

`core/llm-server/ui/js/setup-ui/defaults/DefaultsPrefs.js`

The Defaults settings outside the launch payload (auto-unload, unload on VRAM pressure, tool approval, RAM-pin status), cached so a re-render never redraws one as unset.

## Methods

- `load(api)`: each read best-effort; a missing getter leaves its row out; a failed RAM-pin read keeps the last status. `ramPinSupported()`, `policyFrom(r)`, `AUTO_UNLOAD_MS` (15 min).

## Globals

None.
