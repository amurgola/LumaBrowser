# ClientHintHeaders

`core/browser/identity/ClientHintHeaders.js`

Rewrites the User-Agent Client Hint headers of an outgoing request to match
[ChromeIdentity](../ChromeIdentity.md).

## Methods

- `ClientHintHeaders.rewrite(headers)` mutates and returns `headers`:
  - every existing `sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform` and
    high-entropy hint is removed, in any casing;
  - `Sec-CH-UA`, `Sec-CH-UA-Mobile`, `Sec-CH-UA-Platform` are always set;
  - a high-entropy hint (`full-version-list`, `full-version`,
    `platform-version`, `arch`, `bitness`, `model`) is re-emitted, as
    `Sec-Ch-Ua-...`, only if the request already carried it.
  Non-object input is returned untouched.

## Why

Chromium only sends high-entropy hints after a server opts in via `Accept-CH`;
volunteering one would itself be a tell. Electron allows one
`onBeforeSendHeaders` listener per session, so this is called from the shared
hook in `main.js` rather than registering its own.
