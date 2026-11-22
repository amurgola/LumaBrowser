# MoreSettingsChips

`core/llm-server/ui/js/setup-ui/defaults/MoreSettingsChips.js`

What the collapsed "More settings" handle says: only the values that differ from a fresh install.

## Methods

- `labels(defaults, prefs)`, `html(defaults, prefs)`. Among the pref chips: `Auto-unload`, `Unload on VRAM pressure`, `Low VRAM warning off` (only when `prefs.vramWarning === false`) and `<n> GB GPU headroom` when not 1 GB.

## Globals

None.

## Changes (2026-11-22, framework refactor)

The framework option chips (KV, parallel, tensor split, context retention, MoE GPU cache off, peer GPUs, RAM pin) moved to [FrameworkOptionChips](../frameworks/FrameworkOptionChips.md) on each framework's Options fold. `chipsHtml(labels)` draws a label list as plain fold chips for both.
