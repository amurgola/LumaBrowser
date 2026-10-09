# RuntimeTraceScripts

`core/diagnostics/RuntimeTraceScripts.js`

Page script sources that [RuntimeTraceCapture](RuntimeTraceCapture.md) runs in
the shell renderer with `executeJavaScript`.

## Members

- `RuntimeTraceScripts.RENDERER_INSTALL` installs `window.__lumaRuntimeTrace`:
  long tasks, slow input events (32 ms threshold, with target `#id` or tag),
  rAF frame gaps over 33 ms, resize and mouse-move counts, and, when the shell
  defines them, `computeViewBounds` call count and time and `lastBoundsSent`
  changes. Returns true.
- `RuntimeTraceScripts.RENDERER_STOP` stops the counters, restores
  `computeViewBounds`, and returns the collected data (or null if never installed).
- `RuntimeTraceScripts.toast(text, ttlMs)` shows or updates one fixed toast at
  the bottom of the shell; `ttlMs` 0 keeps it until replaced.
- `RuntimeTraceScripts.TOAST_ID` `lumaRuntimeTraceToast`.

## Why strings

Kept as strings so the shell page needs no preload change and the counters live
only for the capture.
