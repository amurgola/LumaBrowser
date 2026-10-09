# ModelQueue

`core/llm-service/ModelQueue.js`

One model's FIFO of pending LLM tasks, gated by a concurrency limit. Owned by
[LLMQueueManager](LLMQueueManager.md).

## Methods

- `new ModelQueue(modelId, maxConcurrency)`; `maxConcurrency` is a public,
  writable field.
- `add(task)`, `hasFreeSlot()` (a slot is free and work is pending),
  `takeNext()` (claims a slot and dequeues), `finish()` (frees the slot and
  counts a completion).
- `pendingTasks()` returns a copy of the pending list.
- `stats()` returns `{ modelId, activeCount, pendingCount, maxConcurrency, completedCount }`.
