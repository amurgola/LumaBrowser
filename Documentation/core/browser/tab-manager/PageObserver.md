# PageObserver

`core/browser/tab-manager/PageObserver.js`

observe_page: the numbered inventory of visible interactive elements, tagged `data-luma-ref`.

## Methods

- `PageObserver.observe(page)` -> `{ success, data: { text, count, dropped, title, url } }` or `{ success: false, error }` (`digest failed` when the page answered nothing).

## Why

Tagged elements let click, type, fill_form and press_key take `{ ref: N }` instead of a model-authored selector.
