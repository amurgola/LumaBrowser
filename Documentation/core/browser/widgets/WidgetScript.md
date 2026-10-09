# WidgetScript

`core/browser/widgets/WidgetScript.js`

The shared frame of every widget page script ([SelectScripts](SelectScripts.md),
[FieldScripts](FieldScripts.md), [ListScripts](ListScripts.md)).

## Methods

- `WidgetScript.wrap(name, body)`: `/* luma-widget:<name> */ (function() { try { <helpers> <body> } catch ... })();`.
  A throw becomes `{ success: false, error }`. The marker names the step for
  DevTools traces and lets test fakes answer by step instead of call order.
- `WidgetScript.refArg(ref)`: an integer or null, so a ref never reaches the page as text.
- `WidgetScript.COMMON_SRC`: in-page helpers `__norm`, `__find(ref, selector)`
  (with the model-facing "call observe_page again" error for a stale ref),
  `__visible`, `__name` (aria-label, aria-labelledby, text, value, title),
  `__point` (centre after scrollIntoView, plus whether something covers it),
  `__setNative` (the prototype value setter React's tracker sees),
  `__clearMarks`.
- `WidgetScript.MARKS`: `data-luma-widget-target`, `data-luma-widget-input`,
  `data-luma-opt`, `data-luma-prepopup`, `data-luma-loadmore`. Inspect steps
  clear them first so a previous call's leftovers are never acted on.

## Why

Scripts only REPORT what they see and ACT on an element a previous step
marked; the decisions in between happen in Node (the widget matching code), so
they are testable without a browser.
