# MatchPattern

`core/chrome-extensions/bridge/MatchPattern.js`

Chrome extension match patterns tested against URLs, for
`contextMenus` `documentUrlPatterns` and `targetUrlPatterns`.

## Methods

- `MatchPattern.matches(pattern, url)`: `<all_urls>` matches http, https,
  file, ftp, ws and wss. Otherwise `scheme://host/path`: scheme `*` means http
  or https; host `*` is any, `*.example.com` is the domain and its subdomains;
  the path (default `/*`) is a glob over path plus query. Malformed patterns
  or URLs never match.
- `MatchPattern.anyMatch(patterns, url)`: true when the list is empty or
  missing (Chrome's "no restriction"), else when any pattern matches.
