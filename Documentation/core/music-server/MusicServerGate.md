# MusicServerGate

`core/music-server/MusicServerGate.js`

Makes sure the music supervisor is serving the requested model before a
generation request goes out. Used by [MusicRouter](MusicRouter.md), one
instance per request.

## Methods

- `new MusicServerGate(musicServerService)` reads `musicServerService.server`.
- `ensureServing(model, send)` resolves `{ status, cold }` when the server is
  ready on a port (and marks it active), or `{ error }` after emitting
  `send('error', { message })`.
  1. A start already in progress for the same model is joined
     (`status: starting-server`, `waitUntilSettled`).
  2. Not ready, or a different model running: emits `switching-model` or
     `starting-server`, stops a ready or starting server (a failed stop is
     ignored), then `startServerResolved(model.id)`. `cold` is true.
  3. Errors: the start result's `error`, else `Failed to start the music server.`;
     `Music server is <state>, not ready.` when it still has no port.

## Why

Coalescing onto an in-progress start avoids stopping and relaunching a server
that is already loading the right weights (a cold load of MiniMax-Music3 takes
minutes).
