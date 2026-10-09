# TestHarnessService

`extensions/ext-test-harness/TestHarnessService.js`

The Test Harness operations the IPC handlers and REST routes share.

## Methods

- `new TestHarnessService({ discovery, executor, repository })`.
- `discoverTests()`: the discovery scan.
- `runTest(testId, variantId, options?)`: resolves the finished
  [TestRunLog](lib/TestRunLog.md); throws `Test "<id>" not found`. An unknown
  variant id runs with no variant, as in legacy.
- `startTest(testId, variantId)`: starts the run in the background and returns
  `{ success: true, message: 'Test "<id>" started (variant: v)' }` or `{
  success: false, error }`. Progress and the result are logged; a crash is
  logged instead of becoming an unhandled rejection.
- `getTestRuns(limit = 50, offset = 0)`, `getTestRunDetail(runId)`,
  `deleteTestRun(runId)` (true when deleted), `clearAllRuns()`.
