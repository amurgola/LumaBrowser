# ExtensionEventBus

`core/shell/extensions/ExtensionEventBus.js`

`context.events`: a per-extension publish/subscribe bus.

## Methods

- `on(event, callback)`, `off(event, callback)`.
- `emit(event, data)` calls each listener; a throwing listener is logged
  (`Event error [<event>]:`) and the rest still run.
