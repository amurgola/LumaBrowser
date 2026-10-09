# CastResolver

`extensions/roleplay-mode/world/CastResolver.js`

Resolves which characters are in a moment: the tracked present cast, names in
the passage as a fallback, lookups by name, and the director's focus order.

## Methods

- `CastResolver.currentEntries(data)` `[{ char, state }]` for present state
  entries (matched by `charId` or case-insensitive name); empty before any state.
- `CastResolver.forMoment(data, content)` the tracked entries, else characters
  named in the passage (`state: null`).
- `CastResolver.byName(data, name)` or null.
- `CastResolver.orderByFocus(entries, shot)` focus characters lead; a solo
  focus (`group` false, one name) keeps only them; no focus returns `entries`.
