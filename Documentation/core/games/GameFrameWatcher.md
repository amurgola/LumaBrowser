# GameFrameWatcher

`core/games/GameFrameWatcher.js`

Polls a game window's frame signature for a change, or for stillness.

## Methods

- `new GameFrameWatcher({ frameHash, sleep, now })` `frameHash(args)` returns
  `{ success, data: { hash } }` (GameController.frameHash).
- `waitForChange(args)` until the frame differs from `args.since` (or the frame
  at call time) by `minDistance` bits, or `timeoutMs` passes:
  `{ changed, distance, ms, hash }`.
- `waitForStill(args)` until the frame stayed within `maxDistance` bits for
  `stableMs`, or `timeoutMs` passes: `{ still, ms, hash }`. A bigger change
  resets the stability clock.
- A failing capture returns its failure. Options as in [GameControlArgs](GameControlArgs.md).

## Why

A vision look costs about 0.8 s, so between looks the loop asks the cheap
questions: did my input do anything, and has the animation (or the enemy's turn)
played out so the next screenshot is worth planning on.
