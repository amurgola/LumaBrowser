# ElementDigestFormatter

`core/browser/tab-manager/ElementDigestFormatter.js`

Renders an [ElementDigest](../extraction/ElementDigest.md) result as the numbered text block the model reads.

## Methods

- `ElementDigestFormatter.format(result, { maxChars = 2400 })`: `PAGE: <title> - <url>`, the in-view rows
  (`  [ref] role "label"`, or `none found`), below-the-fold rows while the budget lasts, a dropped-count
  hint when anything was left out, and the `Interact by ref` footer.

## Why

The budget keeps the digest inside tool results without eating the history cap. The dropped hint names `get_source {"type": "text"}` first: the old "scroll, then observe_page again" wording drove models into a scroll/observe loop to read a table one get_source returns whole.
