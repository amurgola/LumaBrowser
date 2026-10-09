# OptionalServiceCall

`core/shell/settings/OptionalServiceCall.js`

One reply shape for the optional Settings integrations: the `luma` terminal
launcher, the JetBrains plugin and the VS Code extension.

## Methods

- `async OptionalServiceCall.run(service, messages, fn)` `{ success: false,
  error: messages.missing }` when `service` is null; else `{ success: true,
  ...(await fn(service)) }`; a throw becomes `{ success: false, error:
  err.message || messages.failed }`.
- `OptionalServiceCall.ideIds(ids)` an array becomes at most 64 strings; anything
  else is `[]` (all detected IDEs).
- `MESSAGES.cliShim|idePlugin|vscodeExtension` `{ missing, failed }`:
  `The terminal launcher is not available in this build.` / `launcher operation failed`,
  `The JetBrains plugin is not available in this build.` / `plugin operation failed`,
  `The VS Code extension is not available in this build.` / `extension operation failed`.

## Why

Each toggle renders `{ success, ...status }`, so the three integrations share
one Settings list component.
