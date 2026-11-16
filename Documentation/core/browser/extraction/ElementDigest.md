# ElementDigest

`core/browser/extraction/ElementDigest.js`

In-page script behind the agent's `observe_page` tool: a compact numbered
inventory of the page's visible interactive elements, so the model acts by
reference (`click {"ref": 2}`) instead of authoring CSS selectors.

## Methods

- `ElementDigest.script({ selector = null })` builds the self-invoking page
  script (a string) to pass to `webContents.executeJavaScript`. It returns
  `{ success, title, url, viewport, below, dropped }` where `viewport` and
  `below` are `[{ ref, role, label, box }]` in document order, `box` is
  `[x, y, w, h]` in viewport CSS px at observation time, and `dropped` counts
  elements past the caps. On a page error it returns `{ success: false, error }`.
- With `selector` the inventory covers only the interactive elements inside the
  elements it matches (a match that is itself interactive is listed too), the
  result adds `scope: selector`, and a selector that matches nothing answers
  `{ success: false, error: 'No elements found for selector "<selector>"' }`.
- `ElementDigest.SCRIPT` is `script()`, the whole-page script.
- `CAP_IN_VIEW` (60), `CAP_BELOW` (30), `CAP_BELOW_SCOPED` (150).

## Behaviour

- Candidates: links, buttons, inputs, selects, textareas, summary, common ARIA
  widget roles, `[onclick]`, contenteditable, and a frame whose document is an
  editor (design mode or an editable body), listed with the role
  `input:richtext` and labelled by its `aria-label` or `title`. Any other
  frame, including one the page cannot read (cross-origin), is skipped.
- Skipped: disabled, inside `[aria-hidden="true"]`, `display:none`,
  `visibility:hidden`, or smaller than 2x2 px.
- Nested candidates are dropped in favour of the outermost one.
- Caps: 60 in the viewport, 30 below or above the fold (150 for a scoped
  observation, which was asked for by name). Viewport refs are numbered first.
  Labels are whitespace-collapsed and capped at 80 chars; titles at 120.

## Why

Local quantized models cannot reproduce precision strings like selectors
reliably (the same lesson as web_search URL retyping). Each listed element is
tagged `data-luma-ref="<n>"`, and the ref-accepting tools (click, type,
fill_form, press_key) resolve `[data-luma-ref="n"]` live at action time, so
refs survive layout shifts. A navigation destroys the tags, so a stale ref
fails to resolve and the tool tells the model to observe again. Every run
clears old tags first, so refs are unambiguous per observation. The `box` is
what the set-of-marks overlay draws and what `click_at` coordinates speak.

A long form has more fields than the whole-page caps list, and scrolling to
observe again costs a round trip per screen. A scope selector (`form`,
`[role=dialog]`, a results list) lists that one part in full. An editor frame
gets a ref so `type` can reach the field inside it
([TargetScripts](../tab-manager/TargetScripts.md)).
