# PageObserver

`core/browser/tab-manager/PageObserver.js`

observe_page: the numbered inventory of visible interactive elements, tagged `data-luma-ref`.

## Methods

- `PageObserver.observe(page, { selector })` -> `{ success, data: { text, count, dropped, title, url } }` or `{ success: false, error }` (`digest failed` when the page answered nothing). `selector` lists only the elements inside one part of the page (a form, a dialog, a results list), with the larger caps and budget of a scoped digest ([ElementDigest](../extraction/ElementDigest.md), [ElementDigestFormatter](ElementDigestFormatter.md)); a selector that matches nothing is an error.

## Why

Tagged elements let click, type, fill_form and press_key take `{ ref: N }` instead of a model-authored selector.

## A page only the user can get past

[PageBlockDetector](PageBlockDetector.md) reads the digest: a bot challenge, a
CAPTCHA, a sign-in form or a second-factor prompt adds its `BLOCKED: ...` note
as the digest's last line (the model is told to call `ask_user_takeover`) and
`blocked: { kind, label }` to the data.
