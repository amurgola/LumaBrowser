# StagingPrompt

`extensions/roleplay-mode/stage/StagingPrompt.js`

The messages for the single post-turn STAGE MANAGER call: continuity, wardrobe,
the chronicle and the shot in one strict-JSON `/no_think` pass.

## Methods

- `StagingPrompt.messages(data, content)` `[system, user]`; the passage is
  capped at 4000 characters. The schema's `present` entries carry `intent`,
  `condition`, `bondUser`, `bondChange`, `beat`, `leftTo` and `revealed` (true
  only when what the character hides came into the open in this passage)
  beside the wardrobe fields; the reply also has `events` (`event | reveal |
  promise | death | move | injury`), `clock` (`advance`, `timeOfDay`, `weather`)
  and `threads` (`opened`, `advanced` for known threads the passage moved
  forward, `closed`). The context lists the player, the roster with each
  character's bond, condition, intent and secret (`hides`, so the stage can
  spot a reveal), the prior scene and cast, known locations, the clock and the
  best-ranked open threads (first `THREADS_SHOWN`, 6).
- `StagingPrompt.POSES`.
