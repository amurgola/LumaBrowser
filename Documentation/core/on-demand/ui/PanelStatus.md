# PanelStatus

`core/on-demand/ui/PanelStatus.js`

Paints the mic button, Live badge, speaker toggle and hint line.

## Methods

- `paintVoice(view)`, `paintHint(view)`, `setHint(text, warn)`; `view` is
  `{ state, voiceState, hasVoice, streaming, speak }`.
- `PanelStatus.hintFor(view)` -> `{ text, warn }`: no model (warn), working,
  no speech model, then per voice state.
