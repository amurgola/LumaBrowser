# CookieCommands

`extensions/selenium-driver/commands/CookieCommands.js`

Cookies through `document.cookie` (no HttpOnly cookies), reported with the page hostname and path `/`.

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `getAllCookies`, `getNamedCookie` (`no such cookie`), `addCookie({ cookie })`
  (name required; name and value URI-encoded; optional path and expiry in seconds),
  `deleteCookie` (expires in 1970), `deleteAllCookies`.
