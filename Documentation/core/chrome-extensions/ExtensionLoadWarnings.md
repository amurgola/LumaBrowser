# ExtensionLoadWarnings

`core/chrome-extensions/ExtensionLoadWarnings.js`

Filters Electron's `ExtensionLoadWarning` process warnings.

## Methods

- `ExtensionLoadWarnings.install(proc = process)` wraps `proc.emitWarning`
  once (idempotent). Warnings of any other type pass through untouched.
  Returns the filter, or `null` when `proc` has no `emitWarning`.
- `ExtensionLoadWarnings.typeOf(warning, typeOrOptions)` reads the type from
  the string form, the options form or an `Error`'s `name`.
- `filter(message)` drops `Permission 'x' is unknown.` lines for permissions in
  `COVERED`, and returns `null` when nothing is left or the same remainder was
  already reported for that extension folder.

## Why

Electron warns once per session an extension loads into, and the app gives
every persisted tab its own partition, so one Bitwarden install printed the
same five lines nine times per boot. All five (`contextMenus`, `sidePanel`,
`webNavigation`, `notifications`, `privacy`) are served by the
[ShimBridge](bridge/ShimBridge.md) or stubbed by
[chrome-api-shim](shim/chrome-api-shim.md), so the warning was misleading as
well as noisy. `COVERED` must follow the shim when it gains a namespace.

Installed early by `app/process/ProcessSetup.js`. The crash journal's own
`warning` listener still sees whatever is emitted.
