# AppFilter

`extensions/desktop-integration/features/notifications/AppFilter.js`

Per-app allow and deny rules for the [notifications feature](index.md).

- `new AppFilter({ mode, allow, deny, ignoreSelf })`: `mode` `'all'` or
  `'allowlist'`; `allow`, `deny` as arrays or newline/comma separated text;
  `ignoreSelf` (default true) skips LumaBrowser's own AUMID
  (`com.lumabyte.lumabrowser*`) and names.
- `decide(item, hubApp)` -> `{ allowed, reason }`; reasons `self`, `denied`,
  `not-allowed`. Order: self, deny, then the allow list in allowlist mode.
- `static parseList(value)`: trimmed, lowercased, unique patterns.
- `static matches(pattern, value)`: case-insensitive; without `*` the whole
  value must equal the pattern; `*` matches any run.
- `static anyMatch(patterns, values)`.

Values tested: the display name, the AUMID and the Hub app key.
