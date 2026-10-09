# FrameWaiters

`cli/lib/FrameWaiters.js`

Request and reply over the bridge's one-way frame stream, shared by both sessions.

## Methods

- `wait(type, timeoutMs = 15000)`: resolves the payload of the next frame of that type, or
  `{ __error: { message: 'no <type> from LumaBrowser' } }` on timeout. Never rejects.
- `deliver(type, payload)`: hands the frame to its waiter. A `bridge-error` resolves every pending
  wait with `{ __error: payload }` and returns `true` (the full-screen session then skips its own
  handling of that frame when no turn is streaming).
- `size` (getter).
