# MobileModelInfo

`core/network-sharing/webapp/public/js/web/MobileModelInfo.js`

Phone-only behaviour: `web-overrides.css` restyles the chat's model pill
(`.cm-model-pill`, kept by GearPanel) as an "Info" button; a remote device cannot
change the host's model, so a tap shows what the host runs instead of the picker.

## Methods

- `new MobileModelInfo({ api, win })`; `install(target)` adds a capture-phase
  click listener (so the chat's own pill handler never fires).
- `onClick(e)`: only when `matchMedia('(max-width: 760px)')` matches and the
  click is inside a model pill: prevents and stops it, then shows
  `MobileModelInfo.message(model, host)` (model from the pill's `<b>`, else
  `Unknown`; host from `api.getHostName()`, else `LumaBrowser`) through
  `win.LumaModal.alert(text, { title: 'Connection info' })`, else `win.alert`.

## Globals

Reads `window.matchMedia`, `window.LumaModal`, `window.alert` (through `win`).
