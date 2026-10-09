# CharacterLooks

`extensions/roleplay-mode/world/CharacterLooks.js`

Reads facts out of a character's free-text looks.

## Methods

- `CharacterLooks.eyeColor(char)` e.g. `'green eyes'` from `appearance`, or `''`.
- `CharacterLooks.subjectNoun(char)` `'man'`, `'woman'` or `'person'`.
- `CharacterLooks.booruGender(c)` `'girl'`, `'boy'` or `'other'`, reading
  appearance, persona, name and current outfit (clothing words count).

## Why

A concrete eye colour holds on the cfg~1 edit chain where "the same eye colour"
let green eyes turn blue.
