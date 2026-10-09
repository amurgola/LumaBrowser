# RendererGlobal

`core/shell/ui/extensions/RendererGlobal.js` (ES module)

The `window.__ext_<id>` contract every extension renderer publishes (dashes become underscores).

## Methods

- `RendererGlobal.key(id)`, `RendererGlobal.get(id)`.
- `RendererGlobal.purge(id)`: deletes the global and removes every
  `script[data-ext="<id>"]` the loader tagged.

## Globals

Reads and deletes `window.__ext_<id>`.
