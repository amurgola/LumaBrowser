# ElementEvaluator

`extensions/selenium-driver/ElementEvaluator.js`

## Methods

- `new ElementEvaluator(pageScript)`.
- `resolve(session, uuid)` -> the stored entry; unknown -> `no such element`; no
  longer in the page -> `stale element reference`.
- `evaluate(session, entry, body)`: runs `body` with the element as `el`.
- `read(session, uuid, body)`: resolve then evaluate.
- `readAttached(session, uuid, body)`: as read, but a null result is stale.

## Bug fixed in the port

Legacy's stale check ran `document.querySelector(<encoded locator>)`. The stored
locator is JSON, not CSS, so querySelector threw and every element command (text,
click, clear, send keys, attributes, rect, element screenshot, find from element)
failed with `javascript error`. The check now re-runs the stored locator.
