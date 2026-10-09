# ErrorPage

`core/browser/ui/error-page/ErrorPage.js` (page: `core/browser/tab-view/error.html`, started by `entry.js`)

The page a tab shows when a navigation fails or its renderer crashes (see
[TabErrorPage](../../tab-view/TabErrorPage.md)). Styles moved from the inline
block to `error-page.css` unchanged; it still inlines its colour tokens.

## Methods

- `new ErrorPage(win, doc)`, `start()`: fills title, message, URL, hints and the
  code line from [NetErrorText](NetErrorText.md); Reload goes to the failed URL
  (or reloads), Go back goes back.
- `ErrorPage.parse(search)` -> `{ code, url, desc, host }`;
  `ErrorPage.codeLine(desc, code)` ("desc (code)", or "" without desc).

Globals: `window.location`, `window.history`.
