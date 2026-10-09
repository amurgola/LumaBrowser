# BackgroundRunGate

`core/llm-server/chat/BackgroundRunGate.js`

One shared lock meaning "a background agent run is in flight".

## Methods

- `new BackgroundRunGate()` starts free.
- `tryAcquire(owner = 'unknown')` returns a release token (a Symbol), or `null` when busy.
- `release(token)` frees the gate and returns `true` only for the holder's token.
  Any other token, including `null`, returns `false`.
- `busy` (getter) is true while held; `owner` (getter) is the holder's name or `null`.
- `status()` returns `{ busy, owner, forMs }` for diagnostics.

## Why

The scheduled-task scheduler, the artifact-refresh scheduler and the trigger
runner each used to keep a private `_running` flag, so two of them could start
bridge runs against the same model slot at the same moment. `main.js` builds one
gate and hands it to all three, which serializes background runs while each
owner keeps its own queueing policy (drop on tick vs FIFO): ask `tryAcquire`
before a run, `release` in `finally`. Owners built without a gate (tests,
standalone use) create a private one, so their behaviour is unchanged.
