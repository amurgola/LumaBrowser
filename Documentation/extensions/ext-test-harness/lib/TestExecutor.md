# TestExecutor

`extensions/ext-test-harness/lib/TestExecutor.js`

Runs one harness test.

## Methods

- `new TestExecutor(llmService, repository, services)`: `repository` is a
  [TestRunRepository](TestRunRepository.md); `services` `{ browserService }`.
- `run(descriptor, variant, { onProgress? })`: creates a
  [TestRunLog](TestRunLog.md) and saves it as running; builds a
  [TestAgentRunner](TestAgentRunner.md) from the variant config
  (`maxIterations` default 15, `slotId` default `ai-chat.navigator`) and the [TestHarnessApi](TestHarnessApi.md); runs
  `descriptor.run(harness)` against its timeout (default 300000 ms); marks a
  timeout or a throw; completes a still-running log; saves the summary and the
  full log (persistence errors are logged, never thrown). Resolves the log.
