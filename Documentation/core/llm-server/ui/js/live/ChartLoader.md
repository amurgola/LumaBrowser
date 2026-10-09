# ChartLoader

`core/llm-server/ui/js/live/ChartLoader.js`

Loads the vendored Chart.js once, on the first live module that asks for it.

## Methods

- `ChartLoader.ensure()` resolves the `Chart` constructor. If `window.Chart` is
  already a function it resolves at once; otherwise it appends one
  `<script src="/llm-ui/lib/chart/chart.umd.min.js">` and every caller shares
  that promise. A load that sets no global rejects with "Chart.js loaded but its
  global was not set"; a failed fetch rejects with "Chart.js could not be
  loaded: restart the app if you just updated." and allows a retry.
- `ChartLoader.reset()` (tests only).

While loading, a global AMD `define` (installed by Monaco's loader) is hidden
and restored afterwards: Chart's UMD checks for AMD first and would otherwise
register as an anonymous module without setting `window.Chart`.

## Globals

Reads `window.Chart` (set by the Chart.js UMD bundle); hides and restores
`window.define`. The in-flight promise is module state (legacy kept it on
`window.__cmChartLoading`; nothing else read that).
