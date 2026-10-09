# TestToolExecutor

`extensions/ext-test-harness/lib/TestToolExecutor.js`

Executes one tool call of the harness agent. Never throws: a failure is `{
success: false, error }`.

## Methods

- `new TestToolExecutor({ browserService })`.
- `execute(tool, params)`:
  - `click`: a click that navigated reports `urlChanged` and `newUrl` at the
    top level.
  - `screenshot`: returns `{ success, message: 'Screenshot captured', mimeType }`,
    never the image.
  - anything else -> `BrowserTools.executeTool`.
