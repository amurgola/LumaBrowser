# LLMQueueManager

`core/llm-service/LLMQueueManager.js`

Central queue for LLM requests. Each `providerId::modelId` key gets its own
[ModelQueue](ModelQueue.md) with an independent concurrency limit. Extends
EventEmitter.

## Methods

- `registerModel(modelId, maxConcurrency = 4)` creates a queue; ignores a
  model already registered.
- `setConcurrency(modelId, maxConcurrency)` changes the limit and starts any
  pending work the new slots allow; no-op for an unregistered model.
- `ensureConcurrency(modelId, maxConcurrency)` upserts the limit, clamped to an
  integer of at least 1, and emits `queue-stats`.
- `enqueue(modelId, payload, { source, label }, executor)` queues
  `executor(payload)` (auto-registering the model at 4) and returns a promise
  settling with the executor's result or error.
- `getSnapshot()` returns `[{ modelId, maxConcurrency, activeCount,
  pendingCount, completedCount, pendingTasks }]`.

## Events

- `queue-registered` `{ modelId, maxConcurrency }`
- `task-queued`, `task-processing` task info `{ id, modelId, source, label,
  status, timestamp, startedAt }`
- `task-completed` task info plus `durationMs` (status is `completed` for a
  failed task too, and no error is attached)
- `queue-stats` `{ modelId, activeCount, pendingCount, maxConcurrency, completedCount }`

## Why

The default of 4 lets a few parallel slot requests (an agent batch, several
extensions at once) actually run in parallel against one model; most
OpenAI-compatible servers (LM Studio, llama.cpp server, vLLM, clouds) handle
that, and users can lower it per model.

`ensureConcurrency` exists because `setConcurrency` is a no-op for an
unregistered model and `registerModel` is a no-op for a registered one, so
neither alone guarantees the limit lands. LLMServerService uses it to mirror
the local llama-server's `--parallel` slot count, so the slot and agent path
never dispatches more concurrent requests than the server can decode.

The queue only gates the slot path; chat and web routes do not go through it.
