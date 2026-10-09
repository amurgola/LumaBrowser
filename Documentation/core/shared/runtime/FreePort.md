# FreePort

`core/shared/runtime/FreePort.js`

Picks a free loopback port for each managed server and owns the table of fixed
port windows.

## Methods

- `FreePort.findFreePort({ range, exclude = [] } = {})` resolves the first free
  port in `range` (inclusive) that is not in `exclude`, else an OS-assigned
  ephemeral port. Non-numeric `exclude` entries are ignored.
- `FreePort.isPortFree(port)` resolves `true` if `127.0.0.1:port` can be bound.
- `FreePort.ephemeralPort()` resolves an OS-assigned port on `127.0.0.1`.
- `FreePort.portWindow(name)` returns a copy `{ start, end }` of a named
  window; throws `unknown window "<name>". Known: ...` for a bad name.
- `FreePort.PORT_WINDOWS` is the frozen table: `llm` 8080-8099, `image`
  8100-8119, `video` 8120-8139, `whisper` 8140-8159, `music` 8160-8179,
  `router` 8180-8199, `grounding` 8200-8219, `rpcLend` 50052-50059.
- `FreePort.LOOPBACK` is `127.0.0.1`.

## Why one frozen table

When the windows were separate per-supervisor constants, the whisper server
claimed 8120-8139, which the video server already had, while the video server
carried a comment asserting the slots never collide. Nobody had a reason to read
both files. One table means adding a supervisor forces you to see every window.
Deciding which port means owning the table too.

A collision is not a crash: `isPortFree` actually binds to probe, so the second
claimant walks its range and falls through to an ephemeral port. It just
silently voids the invariant the windows exist for. The test suite asserts the
windows are pairwise disjoint.

`portWindow` throws on a typo so the mistake fails at the call site instead of
silently producing range-less, ephemeral-only allocation. It returns a copy so
callers cannot mutate the table.

The `exclude` list is best effort against the ephemeral fallback; collision
odds in the random ephemeral range are negligible. It exists for callers that
need a pair of ports (the image server's public and private proxy).
