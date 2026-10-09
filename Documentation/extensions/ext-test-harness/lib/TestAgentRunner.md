# TestAgentRunner

`extensions/ext-test-harness/lib/TestAgentRunner.js`

Headless, fully instrumented agent loop for harness tests.

## Methods

- `new TestAgentRunner(llmService, services, options)`: `services`
  `{ browserService }`; `options` `{ maxIterations (15), slotId
  ('ai-chat.navigator'), onProgress({ iteration, tool, status }), wait(ms) }`.
- `run(userPrompt)`: resolves `{ finalResponse, iterations,
  conversationHistory, toolCalls, error, durationMs }`.
  1. The prompt's tab line comes from [TestTabs](TestTabs.md); with no usable
     tab an `about:blank` tab is opened first. System prompt from
     [TestAgentPrompt](TestAgentPrompt.md).
  2. Each turn calls `llm.sendCompletion(slotId, messages, { temperature: 0.2,
     timeout: 120000 })`; the last two turns carry a "N step(s) remaining"
     warning. A not-ready failure on the first turn (500, ECONNREFUSED,
     failed, not configured) is retried once after 5 s; any other failure ends
     the run with its error.
  3. A reply without a fenced tool call (`BrowserTools.parseToolCall`) is the
     final answer.
  4. Otherwise the tool runs through [TestToolExecutor](TestToolExecutor.md),
     is recorded, and its JSON result is fed back as `[Tool Result for <tool>]: ...`.
