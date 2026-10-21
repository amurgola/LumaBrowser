# RestartBackoff

`core/shared/runtime/nvidia-smi/RestartBackoff.js`

The exponential delay between restarts of a child that keeps dying, used by
[NvidiaSmiStream](../NvidiaSmiStream.md).

## Methods

- `new RestartBackoff({ baseMs = 1000, maxMs = 60000, factor = 2 })`. Guards:
  a non-positive base falls back to the default, a max below the base becomes
  the base, a factor below 1 becomes 2.
- `next()` the delay for the next attempt, then the ladder advances:
  `base, base * factor, ...` capped at `maxMs`.
- `peek()` the delay `next()` would return, without advancing.
- `reset()` back to the base; the stream calls it on the first healthy block.
- `attempts`.
- Statics `DEFAULT_BASE_MS`, `DEFAULT_MAX_MS`, `DEFAULT_FACTOR`.
