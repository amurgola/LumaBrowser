# MonitorTextExtractor

`extensions/page-change-detector/MonitorTextExtractor.js`

Reads the text a monitor fingerprints.

## Methods

- `new MonitorTextExtractor(browser)`.
- `extract(tabId, monitor)`: with picked `selectors`, runs
  `selectorScript(selectors)` and returns its string; otherwise
  `browser.getSource(tabId, { type: 'text' })`. Null when unreadable.
- `MonitorTextExtractor.selectorScript(selectors)`: the page script joining
  each element's text with `\n---\n`, writing `[missing: sel]` or
  `[invalid: sel]` for a selector that finds nothing or does not parse.

## Why

The markers make an element appearing or disappearing move the checksum.
