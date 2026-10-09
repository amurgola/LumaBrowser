# BrowserDomain

`extensions/cdp-driver/domains/BrowserDomain.js`

Puppeteer and Playwright send `Browser.getVersion` first and give up if it fails, so
it answers before any target is attached.

## Methods

- `Browser.getVersion` -> `{ protocolVersion: '1.3', product: 'LumaBrowser/1.0 (CDP-compatible)', revision: '@luma', userAgent: app.userAgentFallback, jsVersion }`.
- `Browser.close` -> `{}` after closing every automation tab; the app never exits.
- `Browser.getWindowForTarget` -> window 1 for a known target, else 0, with zero bounds.
