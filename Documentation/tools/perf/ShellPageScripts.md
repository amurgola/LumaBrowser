# ShellPageScripts

`tools/perf/ShellPageScripts.js`

Page functions [PerformanceProfiler](PerformanceProfiler.md) runs in the shell window through
`page.evaluate`. They are static arrow-function properties so Playwright can ship their source; each is
self-contained and reports `skipped` (or an empty list) when what it measures is missing.

## Methods

- `installLongTaskObserver()`: buffers long tasks into `window.__perfLongTasks`.
- `installBoundsHook(modulePath)`: imports `BOUNDS_MODULE` (`ui/shell/layout/ViewBoundsReporter.js`, resolved
  against the page URL, so it is the shell's own module record), wraps `ViewBoundsReporter.prototype.computeBounds`
  to count calls and time and capture the live instance, and dispatches a `resize` so the instance shows itself.
  Publishes `window.__lumaPerfBounds = { calculations, calculationMs, reporter }`; resolves whether it got the
  instance. The wrapper stays for the rest of the run.
- `measureBackgroundUpdates()`: 60 content updates inside the hidden `#settingsModal`; returns
  `{ backgroundUpdates, calculations, calculationMs }` (calculations should stay 0).
- `measureGeometry()`: bounds (`reporter.lastSent`) after opening and closing settings, adding and removing a
  full-screen `.lm-overlay`, and a right side panel at 220 px, 320 px and hidden by its ancestor.
- `measureTabSwitches()`: twelve switches between two `about:blank` tabs; the active tab is read from
  `.tab.active[data-tab-id]` and restored, both tabs closed.
- `readRendererTimings()`: paint entries, navigation entries and the buffered long tasks.

Globals read: `openSettings`, `closeSettings`, `window.tabAPI`. Globals written: `window.__perfLongTasks`,
`window.__lumaPerfBounds`.
