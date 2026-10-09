# HostFixActions

`core/llm-server/ui/js/setup-ui/diagnostics/HostFixActions.js`

The fixes the Server Info cards offer for host problems, each reporting next to its button and re-probing when it changed something.

## Methods

- `new HostFixActions({ api, reload })`.
- `recoverGpu(button)`: elevated device restart (`recoverDisplayDevice`), re-probe after 3 s.
- `setAspmOff(button)`: PCIe Link State Power Management off (`setPcieAspmOff`), re-probe after 1.5 s.
- `applyPathFix(button)`: `addNvidiaSmiToPath(dir)`; an already-present PATH explains that the process did not inherit it and keeps the button enabled.
- `copyCommand(button)`: the PowerShell line via [Clipboard](../../dom/Clipboard.md); "Copied" or "Copy failed" for 1.5 s.
- `dismissPathHint()`: `dismissNvidiaSmiPathHint()` then reload.

## Globals

Reads `navigator.clipboard` through Clipboard.
