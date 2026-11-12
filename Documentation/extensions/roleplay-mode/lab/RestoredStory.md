# RestoredStory

`extensions/roleplay-mode/lab/RestoredStory.js`

A twelve-turn roleplay that can be put back in under a second, for tests that
start late in a long story. Both sides of every turn are scripted, and so is
every bookkeeping answer (the stage call per turn, a casting profile per
character, the story editor, the turn-ten summary). Replayed through the real
chat router and the real reaction, it builds the messages, state and timeline a
live session would, with no model.

## The story

Daniel is hungry at the office (a lunch break that ends at one), eats at the
Juniper Cafe, works the afternoon, rides the 14 bus home, meets a neighbour on
the stairs and ends on the sofa with his wife Elena choosing a film.

- Places, in order: the office, the cafe, the bus, the stairwell, the living room.
- On stage at the end: Elena only.
- Elsewhere, each with a known whereabouts: Marcus Bell (at the office until
  seven), Priya Nair (at the cafe), Mrs. Okafor (in flat 2B).
- The lunch-break pressure is set on turn 4 and gone by turn 7; the lunch
  thread closes on turn 6; the film thread opens on turn 12.
- On record for recall: Marcus owes twenty dollars, due Friday; Daniel promised
  to water Mrs. Okafor's plants on Saturday and Sunday and holds her spare key
  on a red ribbon.

## Methods

- `setup(options)`: the story's setup as the page stores it.
- `turns()`: `[{ player, reply, stage, pressure? }]`.
- `script({ fallbackNarrator })`: `{ narrator(call), side(call) }` for a
  `SwitchDispatcher`. The narrator's reply is found by the player's line, a
  bookkeeping answer by the passage it was asked about; an unknown passage gets
  `quietStage` (same place, nobody new, nothing recorded).
- `PROFILES`, `SUMMARY`, `LUNCH_PRESSURE`, `HUNGER_THREAD`, `MOVIE_THREAD`, `SCENES`.
