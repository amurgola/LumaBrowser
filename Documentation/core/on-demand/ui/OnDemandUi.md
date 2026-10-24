# On Demand renderer

`core/on-demand/ui/` (page: `on-demand.html`, loaded from `file://` by OnDemandWindowFactory)

The Luma On Demand view: the floating tile and the Live panel. Start with
[OnDemandPanel](OnDemandPanel.md); voice lives in `voice/` ([OnDemandVoice](voice/OnDemandVoice.md)).

## Loading

`on-demand.html` keeps its CSP (`script-src 'self'`, `connect-src 'none'`),
links `on-demand.css` (copied unchanged) and loads one module, `entry.js`.
From `file://` the relative import of `../../llm-server/ui/js/...` resolves to
the real file, so no import map is needed.

## Look

The tile and panel share the identity of Luma's other floating pieces (the
desktop activity island, Lumabyte): the Luma mark, the `--surface-pop` surface
with a hairline rim, a soft shadow sized to fit inside the window's `--pad`
(a larger blur is cut off at the window edge and reads as a hard line) and a
faint ember glow. The tile is still when idle; its only badge is a warning dot
when no model is set up (`.od-tile-dot.bad`). In the panel the Live badge is the
mark, with the island's speaking bars while listening (`.od-live.on`); while a
turn is in flight (`.od-live.busy`) the island's light runs round the panel's
rim. Listening uses the ember accent, not a status green.

## Globals

Read: `window.onDemandAPI` (preload), `localStorage` (`od.speak`,
`od.autoVoice`), `navigator.mediaDevices`, `AudioContext`, `performance`,
animation frames. Written: none (legacy `window.OdVoice` is gone).
