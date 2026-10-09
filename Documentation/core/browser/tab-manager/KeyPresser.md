# KeyPresser

`core/browser/tab-manager/KeyPresser.js`

press_key with honest feedback.

## Methods

- `KeyPresser.pressKey(page, { key, selector, ref })` -> `data: { key, target, submitted, warning?, evidence? }`
  plus `urlChanged` / `newUrl`. An Enter that did not navigate answers `data.urlChanged: false` and a note.
  A ref wins over a selector.
- `KeyPresser.script(selector, key)`: the in-page dispatcher.

## Why

Script-created KeyboardEvents are untrusted, so the browser skips their default action: Enter in a form field does not submit. The page's listeners still fire, so the events go first and then, for an Enter the page did not preventDefault, `form.requestSubmit()` emulates the default. Only Enter waits for a navigation.
