# ExternalUrl

`core/shell/extension-admin/ExternalUrl.js`

Which URLs the renderer may hand to the OS default browser.

## Methods

- `ExternalUrl.refusal(url)` null for `http:`, `https:` and `mailto:` URLs; else
  `url must be a string`, `invalid URL` or `protocol <p> not allowed`.
- `ExternalUrl.ALLOWED_PROTOCOLS`.

## Why

`shell.openExternal` launches whatever handles the protocol: `file:` would run
programs, custom protocols reach other apps. A page must never get that through IPC.
