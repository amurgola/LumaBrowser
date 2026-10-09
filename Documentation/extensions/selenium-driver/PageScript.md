# PageScript

`extensions/selenium-driver/PageScript.js`

## Methods

- `new PageScript(browser)`.
- `run(tabId, script)`: `browser.executeJs`, unwrapping `{ success, data: { result } }`;
  failure throws `javascript error` with the browser's message.
- `url(tabId)`, `title(tabId)`.
