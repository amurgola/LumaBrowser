# VramWarningSwitch

`core/llm-server/server/vram-watchdog/VramWarningSwitch.js`

The user's switch for the low-VRAM banner, between the VRAM watchdog and the LLM tab.

## Methods

- `new VramWarningSwitch({ isOn, emit })`: `isOn()` reads the setting
  (`LLMServerService.getVramWarning`, `core.llm.vramWarning`); `emit(type, payload)` sends
  a model event to the tab.
- `emit(type, payload)`: the watchdog's emit. `vram-pressure` events pass only while the
  warning is on; every other event always passes.
- `view(state)`: the watchdog state as the banner may see it: unchanged while on, with
  `cards: []` while off.
- `resync(state)`: after the switch flips, re-emits one `vram-pressure` event per card in
  the state: the real band when on, `band: 'normal'` when off, so shown rows clear at once.
- `PRESSURE_EVENT` (`'vram-pressure'`).

## Why

Some pressure is expected (a game or an image model sharing the card), and the banner
then only nags. Only the report to the tab is silenced: the watchdog keeps sampling and
banding, so unload on VRAM pressure still works while the warning is off.
