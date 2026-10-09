# TestHarnessExtension

`extensions/ext-test-harness/TestHarnessExtension.js`

Main-process side of the Test Harness (`debugOnly: true`): discovers extension
integration tests, runs them through a headless agent and keeps full logs.

## Methods

- `activate(context)`: creates the tables through
  [TestRunRepository](lib/TestRunRepository.md), wires
  [TestDiscovery](lib/TestDiscovery.md) over the folder above
  `context.extensionDir`, a [TestExecutor](lib/TestExecutor.md) with
  `context.llm` and `context.browser`, and a
  [TestHarnessService](TestHarnessService.md); registers
  [TestHarnessIpcHandlers](TestHarnessIpcHandlers.md); resolves `{
  discoverTests, runTest(testId, variantId), getTestRuns(limit, offset),
  getTestRunDetail(runId), deleteTestRun(runId) }` (`deleteTestRun` is new,
  for routes.js).
- `deactivate()`: drops the service.

## Entry files

- `manifest.js`: id `ext-test-harness`, `debugOnly`, `loadPriority: 200`, slot
  `runner` on `core:llm-service`, tables `test_runs` and `test_run_logs`,
  `core:browser` tools, bottom-bar `panel.html`, settings `settings.html`,
  routes at `/api/test-harness`.
- `main.js`: `{ activate, deactivate }` delegating to one instance.
- `routes.js`: REST controller (tests, run, runs, run detail, delete run);
  shapes unchanged. The delete route now calls `api.deleteTestRun` instead of
  running SQL on `context.db`.
- `renderer.js`: module entry (loaded by the shell as `type="module"`) that sets
  `window.__ext_ext_test_harness` over [ui/TestHarnessRenderer](ui/TestHarnessRenderer.md).
- `panel.html` (bottom bar, with its `<style>` block) and `settings.html`:
  markup fragments the shell injects into slots, copied unchanged.
