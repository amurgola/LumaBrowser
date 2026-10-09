# NetErrorText

`core/browser/ui/error-page/NetErrorText.js`

The error page's wording per Chromium net error code.

- `NetErrorText.describe(code, desc, host)` -> `{ title, message, hints }`.
  `desc === 'CRASHED'` wins. Rules: not found (-105, -137, -800, -801, -803),
  refused (-102, -104; title "<host> refused to connect", "The site" without a
  host), timeout (-7, -118), certificate (-200 to -299), blocked (-20, -22,
  -27), offline (-106, -130), else "This site cannot be reached". `%h` becomes
  the host or "this site".
