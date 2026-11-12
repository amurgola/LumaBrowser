# ProfileCall

`extensions/roleplay-mode/pipeline/ProfileCall.js`

Runs the casting completion for characters in scene without a profile and
writes the result onto the character. Best effort and bounded.

## Methods

- `new ProfileCall(chat, logger)`.
- `ProfileCall.candidates(data, present)` the characters in the scene for
  which `CharacterProfile.isBlank`, at most `PER_TURN_MAX` (2). Not a walk-on
  ([CastRole](../world/CastRole.md)), and not someone the passage only
  mentioned: a neighbour heard through a wall used to get a past, a secret and
  an attitude to the player before ever appearing.
- `ProfileCall.request(data, char, content)` temperature 0.4, 60 s, `noThink`,
  the setup's model.
- `run(data, chars, content)` true when any card changed; a failure is logged
  and leaves the card as it was. The reply's bonds are parsed against the other
  characters' names, so only cast members get a bond line. A
  [ReactionScope](ReactionScope.md) stop is rethrown, not logged as a failure.

## Changes (2026-11-09, helper model)

The request routes on [SideModel](../mode/SideModel.md).ref(data): the helper model when the story asked for it and it is ready, else the story model.
