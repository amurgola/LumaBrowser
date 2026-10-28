# ProfilePrompt

`extensions/roleplay-mode/prompts/ProfilePrompt.js`

The CASTING DIRECTOR call that writes a new character's profile the first time
they are in scene: strict JSON `{ summary, appearance, voice, wants, hides,
tells: [..], bondUser }` from the premise, tone, player, what is already known
and the passage that introduced them (capped at 2500 characters).

## Methods

- `ProfilePrompt.messages(data, char, content)` `[system, user]` (`/no_think`).
- `ProfilePrompt.parse(text)` the patch for
  [CharacterProfile](../world/CharacterProfile.md)`.apply`, or null.
