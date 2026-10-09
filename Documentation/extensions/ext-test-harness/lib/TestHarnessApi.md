# TestHarnessApi

`extensions/ext-test-harness/lib/TestHarnessApi.js`

Builds the `harness` object a descriptor's `run(harness)` receives.

## Methods (static)

- `build(runner, log, config)`: `{ config, log, runPrompt(prompt), assert: {
  responseMatches, isTrue } }`.
  `runPrompt` runs the [TestAgentRunner](TestAgentRunner.md) and merges the
  result into the log.
- `responseMatches(log, response, regex, message?)`: string patterns become a
  RegExp; a failure records the first 200 characters of the response.
- `isTrue(log, condition, message?)`.

Every assertion records into the log and returns whether it passed.
