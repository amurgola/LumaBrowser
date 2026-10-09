# WatcherForm

`extensions/network-watcher/ui/WatcherForm.js`

The Network Watcher "Add a watcher" form.

## Methods

- `new WatcherForm(els)`: `els` holds `urlPattern`, `sendTo`, `note`, `method`,
  `captureHeaders`, `captureBody`, `formErr`, `testResult`.
- `read()`: `{ urlPattern, sendTo, note, method, captureHeaders, captureBody }`,
  text fields trimmed.
- `clear()`: empties the fields, method back to `*`, both captures off, error hidden.
- `setError(msg)`: shows the message, or hides the line (`ext-hidden`) when empty.
- `setTestResult(msg, ok)`: colours it `var(--good)` / `var(--bad)` (default
  when `ok` is undefined) and clears the text after 6 s.
- `dispose()`: stops the pending clear.
