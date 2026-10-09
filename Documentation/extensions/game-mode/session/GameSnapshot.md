# GameSnapshot

`extensions/game-mode/session/GameSnapshot.js`

The panel's view of a game session and the live `game:state` event that carries it to the chat UI.

## Methods

- `GameSnapshot.EVENT` `game:state`.
- `GameSnapshot.of(session)` `{ id, kind: 'game', gameKind, name, status, files, assets, playable }`.
- `GameSnapshot.nameOf(session)` game.json name, else the folder name; `kindOf(session)` the record's kind, else game.json.
- `GameSnapshot.emit(emit, session)` sends `{ type, payload }` through a tool's emit; no-op without one, never throws.
