# ExtensionActivator

`core/shell/extensions/ExtensionActivator.js`

Activates one discovered extension.

## Methods

- `new ExtensionActivator({ ledger, contexts, wiring })`.
- `activate(id)`: a manifest without `main` is recorded active with `api: {}`
  (renderer-only). Otherwise it requires the main module, builds the context
  with a new ExposeRegistry, registers the LLM slots declared under a required
  `core:llm-service` as `<id>.<slot.id>` (`required` unless `slot.required === false`),
  awaits `activate(context)` (its result or `{}` is the API), seals the
  registry, records the extension and runs [ExtensionWiring](ExtensionWiring.md).
  Throws when loading or `activate()` fails; the caller records it.
