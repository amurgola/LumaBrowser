# ResonantRuntime

`core/llm-server/ui/js/resonant/ResonantRuntime.js`

The ES-module door to ResonantJs ([resonant.js](../../resonant.md), a classic
vendor script the page loads before its module entry).

## Methods

- `ResonantRuntime.isLoaded()`: true when `window.Resonant` is defined.
- `ResonantRuntime.constructorClass()` returns `window.Resonant`, or throws an
  error naming the missing `<script src="/llm-ui/resonant.js">` tag.
- `ResonantRuntime.shared()` returns the one page-wide instance (created on
  first call with default options). Shared templates, transforms and handlers
  live on it.
- `ResonantRuntime.scoped(rootElement)` returns a new instance bound to one
  element and not to `window` (`{ rootElement, bindToWindow: false }`), as live
  modules get.
- `ResonantRuntime.reset()` forgets the shared instance (tests only).

## Globals

Reads `window.Resonant`. The shared instance is held by this module, not on
`window` (legacy kept it on `window.lumaBrowserResonant`; no other surface read
it).
