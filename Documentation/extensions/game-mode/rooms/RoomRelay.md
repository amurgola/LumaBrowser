# RoomRelay

`extensions/game-mode/rooms/RoomRelay.js`

The multiplayer room relay: a message relay, not a game server. Sockets join one room per game; every JSON object message is relayed to the other players with a `from` stamp; joins and leaves produce `welcome`, `peer-joined`, `peer-left`. Game logic lives in the generated game's netcode.

## Methods

- `new RoomRelay({ maxPerRoom = 8, WebSocketServer? })`; `available`.
- `issueToken(room)` one stable random 128-bit token per room; `validate(token, room)`.
- `handleUpgrade(req, socket, head)` the raw upgrade entry; destroys the socket without ws, on a bad token, or when the room is full.
- `stats(room)` `{ players }`.

## Auth

Upgrades bypass Express (and ApiSecurity) and browsers cannot set Authorization on `new WebSocket()`, so the token minted by the bearer-guarded POST route IS the credential.
