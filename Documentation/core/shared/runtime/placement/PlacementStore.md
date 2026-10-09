# PlacementStore

`core/shared/runtime/placement/PlacementStore.js`

Reads and writes the v2 [placement layout](../PlacementLayout.md) in settings.

## Methods

- `PlacementStore.load(settingsDb)` the stored layout under
  `core.placement.layout` (JSON string or object), normalized. With no stored
  layout, or corrupt JSON, it returns `migrateLegacy(settingsDb)`. No store
  means `emptyLayout()`.
- `PlacementStore.save(settingsDb, layout)` normalizes, writes JSON (write errors
  ignored) and returns the normalized layout.
- `PlacementStore.migrateLegacy(settingsDb)` builds, without writing:
  - `core.placement.autoStart` and `autoStopMs` carried over;
  - mode `manual`: each `core.placement.plan` entry becomes an item placement:
    `target: 'ram'` -> `ram`; one device -> `g<n>`; several -> a `gpu-group`
    `grp_<a>_<b>`; a split is kept only when it matches the device count;
  - mode `hotswap`: a singularity `s_migrated` on `core.placement.hotswapCard`
    over both image items, plus the LLM when `hotswapScope` is `all`;
  - mode `auto`: the empty layout.
- `PlacementStore.LEGACY_KEYS` the old key names.

## Why

Upgraded installs keep their pins. Migration never writes: the first save from
the Advanced tab persists the v2 layout.
