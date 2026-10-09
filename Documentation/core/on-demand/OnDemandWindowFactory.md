# OnDemandWindowFactory

`core/on-demand/OnDemandWindowFactory.js`

Creates the On Demand surface: a frameless, transparent child `BrowserWindow`
of the shell window.

## Methods

- `OnDemandWindowFactory.create(parent, { onLoaded, onInput, onClosed })`
  builds the window, hides its menu bar, wires `did-finish-load`,
  `before-input-event` and `closed`, denies `window.open`, loads the panel page,
  and opens detached DevTools when `LUMA_ON_DEMAND_DEVTOOLS` is set.
- `OnDemandWindowFactory.options(parent)` returns the constructor options:
  hidden, frameless, transparent (`#00000000`), no native shadow, no thick
  frame, not resizable or movable, skip taskbar, focusable, sized to the icon
  plus `PAD` on each side; `contextIsolation`, no node integration,
  `sandbox: false`, no background throttling.
- `PRELOAD_PATH` (`core/on-demand/on-demand-preload.js`) and `HTML_PATH`
  (`core/on-demand/ui/on-demand.html`).

## Why

- Per-pixel transparency of a view over another view is unsupported on Windows
  (electron#45104); an owned transparent window composites through DWM, so the
  rounded corners and shadow are genuinely see-through and it stays above its parent.
- The tile draws its own CSS shadow in the `PAD` margin, hence `hasShadow: false`;
  `thickFrame: false` stops an invisible Windows resize border eating edge clicks.
- The preload and the `ui/` page are renderer files deferred by the port; these
  paths must keep pointing at them once they are ported.
