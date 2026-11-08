# SurfaceGrounding

`extensions/roleplay-mode/grounding/SurfaceGrounding.js`

What a body shows, sheds or is going through right now, from the surface pack
(`grounding/packs/surface/`, scope `roleplay:surface`, 31 cards):

- feet and legs: wet footwear, working feet, old feet, child feet, pregnancy
  swelling, legs after spinal cord injury;
- hands, skin and smell: working, wheelchair user's, old, cold and wet hands,
  skin up close, the smell of a body after a hard night;
- blood and wounds: fresh blood, a severed limb, blood loss and shock, an
  infected wound, death and the body, a belly wound;
- sweat and hygiene: sweat by cause and area, freshly washed, unwashed for
  days, breath, intimacy and the state of the body;
- fluids and illness: saliva, tears and a running nose, vomiting, urine,
  faeces and latrines, gut illness, fever, menstruation.

The notes reach the narrator for that turn only, through
[BodyNotes](../prompts/BodyNotes.md) `surfaceLines`. The narrator invents the
details, and the stage call records the lasting ones as marks
([CharacterMarks](../world/CharacterMarks.md)).

## Two kinds of card

- **Moment cards** need a `When` phrase in the part of the player's line about
  that character, plus a `Tags` phrase in the character's text (description,
  looks, profile, condition) or `Tags: *` for any body. Example: boots coming
  off, a kiss, someone throwing up.
- **Standing cards** (`When: *`) apply on every turn the character's tracked
  condition contains one of their `Tags`. They are checked against the
  condition only, so a description like "blood-red hair" never calls the
  bleeding card. Extra words after the star (`When: *, burning hot, feverish`)
  also trigger the card from the character's part of the line, before the stage
  has recorded the condition. Examples: bleeding, a severed limb, fever,
  dysentery, unwashed for days, freshly washed.

## Selection

- **Idioms:** a card's `Unless` phrases are blanked out of the line before its
  `When` words are matched. Without this, "Dana cuts through the crowd" and "a
  blood orange juice" called the fresh-blood card in the control scenario.
  For a standing card, an `Unless` phrase in the condition cancels the card
  outright ("hair wet from washing" ends "unwashed for days"; "bleeding has
  stopped", "the fever broke"), because the stage call tends to append to a
  condition rather than rewrite it.
- **Attribution:** the line is split into sentences and clauses. A part that
  names characters (first name, possessive included) belongs to them; a part
  that names nobody belongs to whoever was named last. So "Sister Agathe brings
  hot water. I help Ines with her socks" gives the socks to Ines.
- **Ranking:** standing cards outrank moment cards, at most `STANDING_MAX` (2)
  of them, so what the player is doing keeps a slot. The limit is
  `PER_CHARACTER` (3) cards per character in all.
- **Ownership:** a standing card someone holds through their condition is not
  also pinned on another character by a word in the line. Without this, the
  surgeon saying "the stump must be burned shut" would get the severed-limb
  card.

## Methods

- `new SurfaceGrounding({ rag?, cards?, Retriever? })`, `shared()`,
  `enabled(data)` (false with `options.surfaceGrounding: false`), `sync()`.
- `forMoment(characters, playerText)` -> `{ [characterId]: [{ id, title,
  body }] }`; never rejects.
- `forCharacter(c, paddedMoment)` (each note also carries `via`: `moment`,
  `condition` or `word`), `SurfaceGrounding.attribute(characters, text)`,
  `without(paddedMoment, unless)`, `named(c, paddedText)`, `describe(c)`.
