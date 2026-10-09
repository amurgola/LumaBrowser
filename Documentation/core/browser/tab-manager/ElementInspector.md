# ElementInspector

`core/browser/tab-manager/ElementInspector.js`

get_element and the batched selector check.

## Methods

- `ElementInspector.getElement(page, { selector, text })` -> `data: { tagName, text, textTruncated, value, disabled,
  checked, readOnly, href, src, className, id, name, type, placeholder, boundingBox, visible, matchCount }`.
- `ElementInspector.checkSelectors(page, selectors)` -> `{ success, results: [{ selector, found, matchCount, tagName, error? }] }`;
  an empty or non-array list answers `results: []` without touching the page.
- `elementScript(selector, text)`, `checkScript(selectors)`.

## Why

Callers check many selectors at once; one page call is far cheaper than a round trip per selector.
