# CurrentState

`extensions/roleplay-mode/world/CurrentState.js`

The per-moment state (`data.currentState`: scene id and present cast).

## Methods

- `CurrentState.clone(state)` a copy with shallow-copied entries, or null.
- `CurrentState.replace(data, next)` sets it; true when it changed (JSON compare).
