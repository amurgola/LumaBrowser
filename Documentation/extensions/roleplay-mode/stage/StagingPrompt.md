# StagingPrompt

`extensions/roleplay-mode/stage/StagingPrompt.js`

The messages for the single post-turn STAGE MANAGER call: continuity, wardrobe,
the chronicle and the shot in one strict-JSON `/no_think` pass.

## Methods

- `StagingPrompt.messages(data, content)` `[system, user]`; the passage is
  capped at 4000 characters. The schema's `present` entries carry `intent`,
  `condition`, `bondUser`, `bondChange`, `beat`, `leftTo` and `revealed` (true
  only when what the character hides came into the open in this passage) and
  `noticed` (lasting physical details shown for the first time, such as
  calluses or a scar; passing states stay in `condition`) beside the wardrobe
  fields; the roster lists each character's recorded marks as `| noticed:` so
  they are not reported again; the reply also has `events` (`event | reveal |
  promise | death | move | injury`), `clock` (`advance`, `timeOfDay`, `weather`)
  and `threads` (`opened`, `advanced` for known threads the passage moved
  forward, `closed`). The context lists the player, the roster with each
  character's bond, condition, intent and secret (`hides`, so the stage can
  spot a reveal), the prior scene and cast, known locations, the clock and the
  best-ranked open threads (first `THREADS_SHOWN`, 6).
- `StagingPrompt.POSES`.

## Only what the story draws

`StagingPrompt.draws(data)` -> `{ shot, slots }` from the story's options:

- `shot` (the illustration block) is asked for only with `autoImage`, since
  only reaction images read it.
- The wardrobe `slots` and `head` / `face` items are asked for only with
  `autoImage` or `autoAvatarArt`, since only outfit and avatar art read them.
- The plain outfit text is always asked for, because the narrator reads it.
- Data without an options object keeps the full schema.

With images off, the stage prompt drops from about 2,770 to about 2,120 tokens
per turn (measured 2026-11-08 on the body scenario), and the reply loses its
largest image-only parts. An outfit recorded without slots gets them the first
time a later stage call sends them ([OutfitWardrobe](../pipeline/OutfitWardrobe.md)),
so turning images on mid-story is safe.

The `condition` rule asks for the body's state as it is now, in about 20
words at most, rewritten rather than appended. A jungle run had the stage keep
"unwashed for five days" and add "hair wet from washing" after a wash.

## Changes (2026-11-09)

The `present` rule asks for EVERY non-player character present after the
passage: start from the prior present characters, keep each unless they
clearly left (a silent one is still present, with "" for `beat`), then add
arrivals. The reconciler no longer times a quiet character out, so the list
is the only way a character leaves without a move.

## Changes (2026-11-09, helper model)

`schema(draws)` the reply's JSON schema (the shape `_schema` spells out in prose; `shot` optional, the rest required: `newCharacters`, `location`, `present`, `events`, `clock`, `threads`, `pressure`; see the 2026-11-12 changes for `location`; slots, head and face only when the story draws), `responseFormat(draws)` the OpenAI `response_format` carrying it.

## Changes (2026-11-12)

- `location` is a required key of the schema. While it was optional a 24B
  model left it out on every turn of a live story, so no place was ever
  recorded. An unknown place is an empty `name`, which the parser drops.
- `newCharacters` and `present` list named characters only. People the
  passage only mentions, overhears or sees in the background (a customer, a
  guard, a crowd) are scenery: they are left out and never given a label such
  as "Customer 1".
- `events`: at most two, each one sentence of at most 25 words, of what
  happened between the player and the characters. Gossip, background noise
  and things only mentioned are not events.
- `threads.opened`: at most one, and only a new question no known thread
  already covers. `closed` also takes a thread the passage made moot.
- `clock`: `timeOfDay` is one of the clock's own words (dawn to late night),
  `weather` one or two words; most beats advance `none`.
- `emotion` is one to three plain words, `beat` one short sentence in the
  stage's own words, `noticed` never a gesture, habit, movement or expression.
- The roster no longer prints `currently wearing: (unknown)` for a character
  without a known outfit, and the wardrobe rule says never to write
  "unknown".

## A walk-on gets a name, and the pressure is checked every turn

- `newCharacters[].was` (a required string): when the passage gives a name to
  someone already in the known characters under a label (the "Woman" says she
  is Clare), that exact known label; they are the same person and are listed
  once, under the new name, in `present` too. Otherwise `""`.
  [CastRename](../world/CastRename.md) renames the walk-on in place from it.
- The roster marks such a label with ` (a label: no name given yet)` right
  after the name: a character the story introduced (`origin` `story`) whose
  name [CastRole](../world/CastRole.md)`.isLabel` calls a label. A label the
  player set up is that character's name and is not marked.
- `pressure` (a required top-level string, after `threads` and before the
  optional `shot`): the pressure before this passage, checked against what
  just happened. Copied verbatim when it still holds; `""` when the passage
  resolved it, the player walked away from it, or it describes a moment that
  is now over. The stage never invents one.
- The context ends with `Pressure before this passage: ...` (`(none)` when
  the story has no pressure line).

A pressure written by [PressureCall](../pipeline/PressureCall.md) used to
stand until that call's next run, up to five turns after the story had moved
past it. [StageReconciler](StageReconciler.md) now clears it the same turn.
