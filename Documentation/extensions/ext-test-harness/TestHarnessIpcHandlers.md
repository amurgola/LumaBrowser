# TestHarnessIpcHandlers

`extensions/ext-test-harness/TestHarnessIpcHandlers.js`

IPC controller of the Test Harness. Channels (all `ext.ext-test-harness.*`):

| Channel | Reply |
|---|---|
| `discoverTests()` | test list (raw) |
| `runTest(testId, variantId)` | `{ success: true, message }` at once, or `{ success: false, error }` |
| `getTestRuns(limit = 50, offset = 0)` | run rows (raw) |
| `getTestRunDetail(runId)` | detail or null (raw) |
| `deleteTestRun(runId)` | `{ success: <deleted> }` or `{ success: false, error }` |
| `clearAllRuns()` | `{ success: true }` or `{ success: false, error }` |

## Methods

- `TestHarnessIpcHandlers.register(ipc, service)`.
