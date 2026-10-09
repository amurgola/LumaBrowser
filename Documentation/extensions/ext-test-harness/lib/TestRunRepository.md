# TestRunRepository

`extensions/ext-test-harness/lib/TestRunRepository.js`

Plain queries over `test_runs` and `test_run_logs`.

## Methods

- `new TestRunRepository(db)`: the extension's DatabaseService.
- `ensureTables()`: creates both tables (SQL unchanged).
- `saveSummary(summary)`, `saveFullLog(fullLog)`: `INSERT OR REPLACE` of
  [TestRunLog](TestRunLog.md)'s rows.
- `list(limit = 50, offset = 0)`: newest first.
- `detail(runId)`: the run with `config`, `assertions` and `fullLog` parsed
  (unparseable JSON is returned as text), or null.
- `delete(runId)` (true when a run row went), `clear()`.
