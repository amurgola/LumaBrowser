# On Demand renderer

`core/on-demand/ui/` (page: `on-demand.html`, loaded from `file://` by OnDemandWindowFactory)

The Luma On Demand view: the floating tile and the Live panel. Start with
[OnDemandPanel](OnDemandPanel.md); voice lives in `voice/` ([OnDemandVoice](voice/OnDemandVoice.md)).

## Loading

`on-demand.html` keeps its CSP (`script-src 'self'`, `connect-src 'none'`),
links `on-demand.css` (copied unchanged) and loads one module, `entry.js`.
From `file://` the relative import of `../../llm-server/ui/js/...` resolves to
the real file, so no import map is needed.

## Globals

Read: `window.onDemandAPI` (preload), `localStorage` (`od.speak`,
`od.autoVoice`), `navigator.mediaDevices`, `AudioContext`, `performance`,
animation frames. Written: none (legacy `window.OdVoice` is gone).
