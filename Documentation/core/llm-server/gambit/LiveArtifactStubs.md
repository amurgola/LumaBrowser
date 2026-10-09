# LiveArtifactStubs

`core/llm-server/gambit/LiveArtifactStubs.js`

Inert stand-ins for the names the live-artifact runtime hands a module, so the gambit can prove
a module loads without a real renderer.

## Methods

- `LiveArtifactStubs.create()` returns `{ root, R, store, Chart, luma, __ambient }`. `root` is a
  DOM-ish element whose queries return chainable no-op elements; `R` has the ResonantJS public
  surface; `store` and `luma` are async; `__ambient` holds browser globals (`document`, `fetch`,
  timers that run their callback immediately, `requestAnimationFrame`, `window`).
- `LiveArtifactStubs.INJECTED` is `['root', 'R', 'store', 'Chart', 'luma']`, the order they are
  passed as wrapper parameters.

## Why R must match the real API

The first version stubbed a guessed `bind/set/get` surface and failed a model that had written
perfectly good `R.add('n', 0)`. A stub narrower than the thing it stands in for measures the
stub, not the model, and fails in the direction that looks like a model bug. When ResonantJS
gains a public method, add it here too.
