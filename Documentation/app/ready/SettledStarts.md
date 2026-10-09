# SettledStarts

`app/ready/SettledStarts.js`

The ready-time starts that follow the main ready phase (their own `whenReady`
callback, as in legacy).

## Methods

- `new SettledStarts(ctx, { log?, setTimeoutFn? })`.
- `run()`: `localApiServer.resume()` (starts only when enabled; errors ignored),
  [SharingResume](../sharing/SharingResume.md)`.schedule()` (3 s), and
  `placementService.maybeAutoStart()` after 4 s, warning
  `[placement] auto-start failed:` on a failure.
