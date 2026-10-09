# ResolutionCacheKey

`core/browser/resolution-cache/ResolutionCacheKey.js`

Builds [ResolutionCache](../ResolutionCache.md) keys: `<page pattern>|<action group>|<description>`.

## Methods

- `ResolutionCacheKey.of(url, description, kind)`: the key, or null when the URL or
  the description cannot key an entry.
- `ResolutionCacheKey.urlPattern(url)`: origin plus path with id segments replaced
  by `:id`; query and hash dropped (they carry state, not page type). Only http,
  https and file URLs; others give null.
- `ResolutionCacheKey.description(text)`: NFKC, lower case, no quotes (straight or
  curly), collapsed spaces, no trailing punctuation, no leading
  `please`/`click`/`tap`/`press`/`find`/`locate` (`on`) or article.
- `ResolutionCacheKey.kind(kind)`: action groups. `click` and `locate` share
  `click`; `type`, `fill`, `pressKey` share `input`; `wait`, `getElement`, `scroll`
  share `find`. Other kinds stand alone; empty means `click`.
- `ResolutionCacheKey.isIdSegment(segment)`: numeric ids, UUIDs, hex hashes with a
  digit, and opaque tokens (10+ chars, 2+ digits, letters, not a dashed word slug).

## Why

A locate and a click on "the gear icon" want the same node, while "search" as a
click target (the button) and as a type target (the field) must not mix.
`/orders/123` and `/orders/456` are the same kind of page.
