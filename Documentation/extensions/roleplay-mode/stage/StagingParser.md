# StagingParser

`extensions/roleplay-mode/stage/StagingParser.js`

Tolerant parser for the stage call's reply.

## Methods

- `StagingParser.parse(text)` `{ characters, location, currentState, chronicle,
  shot }` or null; accepts the older extraction shape and field aliases. Present
  entries carry `intent`, `condition` (null when omitted, so the last reading
  stands), `bondUser`, `bondChange`, `beat`, `leftTo`, `revealed`, `noticed` (up to 4
  strings). `chronicle`
  is `{ events, clock, threads: { opened, advanced, closed } }` (events capped
  at 6, each thread list at 4, unknown kinds become `event`), or null when the
  reply carries none of its keys.
  Each `characters` entry is `{ name, looks, personality, was }`: `was`
  (alias `formerly`) is the label the character was known under before this
  passage named them, `''` when none or a placeholder
  ([CastRename](../world/CastRename.md) reads it). The chronicle also carries
  `pressure`: the reply's `pressure` string cut like an event's text, `''`
  when the stage wrote `""` or a placeholder, and null when the reply had no pressure string
  (a pressure key alone does not make a chronicle block).
- `StagingParser.distinctEvents(events)` one event per thing that happened:
  an event that mostly repeats an earlier one of the same reply
  ([StoryLedger](../world/StoryLedger.md)`.sameQuestion`) is dropped, before
  the cap. A 24B model filed "Albert bolted away from Clare" and "Clare
  watched Albert's departure" as two memories.
- `StagingParser.sliceJson(text)`, `normalizeShot(obj)`, `normalizeSlots(slots)`.

## Sanitisers (2026-11-12)

What a weaker stage model writes into a field is made fit for the records
before the reconciler sees it:

- `known(value)` the trimmed text, or `''` for a placeholder (`PLACEHOLDER`:
  "unknown", "(not visible)", "n/a", "none"). Applied to looks, personality,
  the location (a placeholder name gives no location), intent, condition,
  bond change, where a character left to and each noticed detail.
- `phrase(value, words)` a short reading: the first clause, at most `words`
  words. `emotion` and `bondUser` take four (`MOOD_WORDS`, `BOND_WORDS`), the
  weather three. The prompt asks for a word or two and got "Indifferent
  initially, doesn't notice the cat yet", which the narrator then read as a
  fact.
- `sentence(value, max)` text under a cap, cut at a sentence end (not at a
  title such as "Mr.") or else at a word, never mid-word. A `beat` takes
  `BEAT_MAX` (160), an event's text `EVENT_MAX` (200).
- `outfit(value)` an outfit with its unknown parts removed ("apron over
  unknown clothing" is an apron).
- `timeOfDay(value)` one of the clock's words (`TIMES`), or `''`; noon is
  midday, midnight is late night.

`threads.opened` keeps one entry (`OPENED_MAX`).
