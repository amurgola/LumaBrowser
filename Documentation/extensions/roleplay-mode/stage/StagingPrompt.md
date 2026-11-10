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

`schema(draws)` the reply's JSON schema (the shape `_schema` spells out in prose; `location` and `shot` optional, the rest required; slots, head and face only when the story draws), `responseFormat(draws)` the OpenAI `response_format` carrying it.
