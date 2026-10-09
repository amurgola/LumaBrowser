# ExtensionContextFactory

`core/shell/extensions/ExtensionContextFactory.js`

Builds the `context` an extension's `activate(context)` receives.

## Methods

- `new ExtensionContextFactory({ coreServices, ipcBridge, ledger, surfaces })`
  (`surfaces`: [ContextSurface](ContextSurface.md) instances).
- `build(manifest, registry)` (`registry`: its ExposeRegistry) returns:
  `extensionId`, `extensionDir`; `browser`, `llm` only when `core:browser`,
  `core:llm-service` are declared (else null);
  `db` a DatabaseService on `ext.<id>` with only the `core:database` tables
  declared (null unless declared and a database exists); `sharedServices`;
  `ipc` (`ipcBridge.forExtension(id)` or null); `logger`
  (`activityLog.forCaller('ext.<id>', { label, description })` or null);
  `extensions` the APIs of declared, active extension deps; `events` an
  [ExtensionEventBus](ExtensionEventBus.md); `expose`; one property per surface (`surface.forExtension(id, manifest)`);
  and `context['<depId>']` shortcuts, except reserved names (warned and skipped).
- `reservedKeys()` the names a shortcut can never take.

## Why

An extension reaches only what its manifest declared. There is no
`context.license`: Keygen licensing is gone.
