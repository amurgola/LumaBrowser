# CastResolver

`extensions/roleplay-mode/world/CastResolver.js`

Resolves which characters are in a moment: the tracked present cast, names in
the passage as a fallback, lookups by name, and the director's focus order.

## Methods

- `CastResolver.currentEntries(data)` `[{ char, state }]` for present state
  entries (matched by `charId` or case-insensitive name); empty before any state.
- `CastResolver.forMoment(data, content)` the tracked entries, else characters
  named in the passage (`state: null`).
- `CastResolver.byName(data, name)` or null. Case-insensitive, by name first;
  when no character has that name, by a label the character was known under
  before they were named (`char.aliases`, kept by
  [CastRename](CastRename.md)). A blank name finds nobody.
- `CastResolver.orderByFocus(entries, shot)` focus characters lead; a solo
  focus (`group` false, one name) keeps only them; no focus returns `entries`.

## One person, one row (2026-11-12)

`byName` falls back to `byPartOfName`: the one character whose name is this
name with words added or left out, titles aside ("Marcus" and "Marcus Bell",
"Okafor" and "Mrs. Okafor"). Two characters that fit means no match. The
narrator tags a speaker by first name while the stage call reports the full
name; taken as two names they became two characters.

`isPlayer(data, name)` is true for the player's own name or a part of it. The
stage reconciler drops stage entries that name the player and the speaker pass
skips them: the player is never a character.
