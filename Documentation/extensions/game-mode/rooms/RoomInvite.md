# RoomInvite

`extensions/game-mode/rooms/RoomInvite.js`

The join details of a room: the ws path carrying room and token, and one ws URL per way to reach the gateway (the request host, then each external IPv4 on the same port).

## Methods

- `RoomInvite.build({ room, token, host, interfaces? })` -> `{ wsPath, wsUrls }`.
