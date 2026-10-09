# FetchQueue

`core/llm-server/chat/live-api/FetchQueue.js`

Caps how many live-artifact page fetches run at once.

## Methods

- `new FetchQueue({ maxConcurrent = 2, maxQueued = 8 })`.
- `run(job)`: resolves the job's result. Up to `maxConcurrent` jobs run; the
  rest wait in order. When `maxQueued` are already waiting it resolves at once
  with `{ success: false, error: 'Too many page fetches in flight (max N
  concurrent, M queued): slow down and batch requests.' }`. A job that throws or
  rejects resolves `{ success: false, error: <message> }` and frees its slot.
  Never rejects.

## Why

One widget looping fetches must not open unbounded silent tabs or balloon the
renderer; failing fast past the queue cap tells the widget author to batch.
