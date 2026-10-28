# ProfileCall

`extensions/roleplay-mode/pipeline/ProfileCall.js`

Runs the casting completion for characters in scene without a profile and
writes the result onto the character. Best effort and bounded.

## Methods

- `new ProfileCall(chat, logger)`.
- `ProfileCall.candidates(data, present, newCharIds)` present or new-this-turn
  characters for which `CharacterProfile.isBlank`, at most `PER_TURN_MAX` (2).
- `ProfileCall.request(data, char, content)` temperature 0.4, 60 s, `noThink`,
  the setup's model.
- `run(data, chars, content)` true when any card changed; a failure is logged
  and leaves the card as it was.
