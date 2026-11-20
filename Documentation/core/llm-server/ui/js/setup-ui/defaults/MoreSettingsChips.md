# MoreSettingsChips

`core/llm-server/ui/js/setup-ui/defaults/MoreSettingsChips.js`

What the collapsed "More settings" handle says: only the values that differ from a fresh install.

## Methods

- `labels(defaults, prefs)`, `html(defaults, prefs)`. Among the pref chips: `Auto-unload`, `Unload on VRAM pressure`, `Low VRAM warning off` (only when `prefs.vramWarning === false`) and `<n> GB GPU headroom` when not 1 GB.

## Globals

None.
