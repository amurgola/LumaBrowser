# ElementClicker

`core/browser/tab-manager/ElementClicker.js`

click: trusted mouse input at the resolved element, the page-world click when covered, then evidence.

## Methods

- `ElementClicker.click(page, { selector, text, ref })` -> `{ success, data: { tagName, text, method, evidence? }, urlChanged?, newUrl? }`.
  `method` is `input` or `synthetic`. Needs a selector or ref.

## Why

Real input gives trusted events, the full pointer sequence, native focus and default actions. A resolver that returns no fingerprint keeps the old fixed 3 s navigation wait and reports no evidence.
