# CharacterProfile

`extensions/roleplay-mode/world/CharacterProfile.js`

A character's profile: the facts that keep them recognisable from scene to
scene. Identity fields (summary, appearance, voice, tells) are fixed once set;
growth fields (wants, hides, bonds) may be rewritten by consolidation as the
story changes them. `summary` and `appearance` stay on the character row as
`description` and `appearance` (the image pipeline reads them); the rest lives
in `char.profile = { voice, wants, hides, tells: [], bonds: { user, <name> } }`.

## Methods

- `CharacterProfile.of(char)` the merged view `{ summary, appearance, voice,
  wants, hides, tells, bonds }`, never null; `tells` accepts a list or an
  `"a; b"` string and is capped at `TELLS_MAX` (3); blank bond keys or values
  are dropped.
- `CharacterProfile.isBlank(char)` true when voice, wants and tells are all
  unset (the casting call should run).
- `CharacterProfile.apply(char, patch, { growthOnly })` writes a call's
  output: identity fields and `summary`/`appearance` only when blank, growth
  fields whenever the patch names them, `bondUser` and `bonds` through
  `setBond`. Returns true when anything changed.
- `CharacterProfile.setBond(char, who, text)` one relationship line; empty
  text removes it. `bondWithUser(char)`.
- `IDENTITY_KEYS`, `GROWTH_KEYS`, `BOND_USER` (`'user'`).

## Why

Consistency and growth pull in opposite directions. Keeping looks, voice and
tells fixed while letting wants, secrets and bonds move is what lets a
character change without becoming someone else.
