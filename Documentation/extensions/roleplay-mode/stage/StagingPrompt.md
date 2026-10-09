# StagingPrompt

`extensions/roleplay-mode/stage/StagingPrompt.js`

The messages for the single post-turn STAGE MANAGER call (continuity, wardrobe
and shot in one strict-JSON `/no_think` pass).

## Methods

- `StagingPrompt.messages(data, content)` `[system, user]`; the passage is
  capped at 4000 characters.
- `StagingPrompt.POSES`.
