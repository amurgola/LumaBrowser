# PathPrefixRewrite

`core/database/settings/PathPrefixRewrite.js`

Rewrites an absolute directory prefix inside stored setting text.

## Methods

- `PathPrefixRewrite.variants(oldPrefix, newPrefix)` returns `[[from, to], ...]`:
  the raw pair, plus the JSON-escaped pair when escaping changes the prefix
  (Windows backslashes). Empty for equal or empty prefixes.
- `PathPrefixRewrite.apply(text, variants)` replaces every occurrence of each
  `from` with its `to`.

## Why two variants

Settings are stored either as raw strings or as JSON text. A Windows path
inside JSON has doubled backslashes, so the raw prefix alone never matches it.
