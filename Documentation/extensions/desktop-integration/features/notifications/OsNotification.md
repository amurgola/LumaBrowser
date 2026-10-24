# OsNotification

`extensions/desktop-integration/features/notifications/OsNotification.js`

Cleans one OS notification from a desktop client into a fixed shape. Pure,
never throws.

- `static normalize(raw, { now, client })` -> `{ ok: true, item }` or `{ ok: false, error }`.
  `item`: `{ app, appId, title, body, lines, at, tag, group, launchUri, imagePath, client, receivedAt }`.
  - Strings are trimmed with whitespace collapsed (the body keeps line breaks)
    and capped: title 500, body 4000, other fields 300, URIs 2048; up to 20
    `lines` of 1000.
  - No title: the first line. No body: the remaining lines. No lines: title
    plus body lines.
  - Needs `app` or `appId` (app falls back to appId) and a title or body.
  - `at`: ISO or epoch ms; missing, invalid or more than five minutes ahead
    becomes `now`.
- `static webUrl(uri)`: the URI when it is http or https, else ''.
