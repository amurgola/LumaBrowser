# ElementDigest

`core/browser/extraction/ElementDigest.js`

In-page script behind the agent's `observe_page` tool: a compact numbered
inventory of the page's visible interactive elements, so the model acts by
reference (`click {"ref": 2}`) instead of authoring CSS selectors.

## Methods

- `ElementDigest.SCRIPT` is the self-invoking page script (a string) to pass to
  `webContents.executeJavaScript`. It returns
  `{ success, title, url, viewport, below, dropped }` where `viewport` and
  `below` are `[{ ref, role, label, box }]` in document order, `box` is
  `[x, y, w, h]` in viewport CSS px at observation time, and `dropped` counts
  elements past the caps. On a page error it returns `{ success: false, error }`.

## Behaviour

- Candidates: links, buttons, inputs, selects, textareas, summary, common ARIA
  widget roles, `[onclick]`, contenteditable.
- Skipped: disabled, inside `[aria-hidden="true"]`, `display:none`,
  `visibility:hidden`, or smaller than 2x2 px.
- Nested candidates are dropped in favour of the outermost one.
- Caps: 60 in the viewport, 30 below or above the fold. Viewport refs are
  numbered first. Labels are whitespace-collapsed and capped at 80 chars;
  titles at 120.

## Why

Local quantized models cannot reproduce precision strings like selectors
reliably (the same lesson as web_search URL retyping). Each listed element is
tagged `data-luma-ref="<n>"`, and the ref-accepting tools (click, type,
fill_form, press_key) resolve `[data-luma-ref="n"]` live at action time, so
refs survive layout shifts. A navigation destroys the tags, so a stale ref
fails to resolve and the tool tells the model to observe again. Every run
clears old tags first, so refs are unambiguous per observation. The `box` is
what the set-of-marks overlay draws and what `click_at` coordinates speak.
