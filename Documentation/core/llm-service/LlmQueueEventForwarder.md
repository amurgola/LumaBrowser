# LlmQueueEventForwarder

`core/llm-service/LlmQueueEventForwarder.js`

Forwards [LLMQueueManager](LLMQueueManager.md) events to the main window for
the live queue view.

## Methods

- `LlmQueueEventForwarder.attach(queueManager, getMainWindow)` subscribes to
  `task-queued`, `task-processing`, `task-completed`, `queue-stats` and
  `queue-registered` and sends each as `core.llm.queue.<event>`. The window is
  looked up per event and skipped when missing or destroyed. A null queue
  manager attaches nothing.
