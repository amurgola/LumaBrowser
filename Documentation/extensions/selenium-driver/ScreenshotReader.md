# ScreenshotReader

`extensions/selenium-driver/ScreenshotReader.js`

## Methods

- `capture(tabId)`: `browser.screenshot(tabId, { fullPage: false })` -> base64 without
  the `data:image/...;base64,` prefix; a failure or missing data is `unable to capture screen`.
