# AppOwnedDir

`core/llm-server/chat/AppOwnedDir.js`

Resolves a directory the app owns under the managed base dir.

## Methods

- `AppOwnedDir.resolve(subdir)`: `<AppPaths.appBaseDir()>/<subdir>`, or `null`
  when the base dir cannot be resolved, and always `null` under jest
  (`JEST_WORKER_ID` set).

## Why

[LlmTrace](LlmTrace.md) and [ToolResultSpill](ToolResultSpill.md) both write
app-owned files and both had the same guard: under jest only a test that
pointed the class at a temp dir may write anything, so other suites (with their
Electron mocks) never leave a `traces/` or `tool-results/` tree behind.
