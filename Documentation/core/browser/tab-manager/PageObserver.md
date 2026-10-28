# PageObserver

`core/browser/tab-manager/PageObserver.js`

observe_page: the numbered inventory of visible interactive elements, tagged `data-luma-ref`.

## Methods

- `PageObserver.observe(page)` -> `{ success, data: { text, count, dropped, title, url } }` or `{ success: false, error }` (`digest failed` when the page answered nothing).

## Why

Tagged elements let click, type, fill_form and press_key take `{ ref: N }` instead of a model-authored selector.

## A page only the user can get past

[PageBlockDetector](PageBlockDetector.md) reads the digest: a bot challenge, a
CAPTCHA, a sign-in form or a second-factor prompt adds its `BLOCKED: ...` note
as the digest's last line (the model is told to call `ask_user_takeover`) and
`blocked: { kind, label }` to the data.
