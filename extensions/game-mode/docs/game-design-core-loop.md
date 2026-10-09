# Game design: the core gameplay loop (what makes a game a game)

Before writing any code, name the loop. A game without a stated core loop becomes a tech demo:
things move, nothing is at stake, nobody replays it. Every design decision below hangs off this.

## The three nested loops every game needs

Design top down, build bottom up.

1. **Moment-to-moment loop (1-5 seconds).** The verb the player performs hundreds of times:
   jump, shoot, dodge, place, match, click. It must feel good on its own, with zero content
   around it. Test: hold the player in an empty room with only this verb. Is it still fun for
   30 seconds? If not, no amount of levels or art saves the game.
2. **Session loop (30 seconds to 5 minutes).** A complete unit of play with a beginning and an
   end: a level, a wave, a run, a round. It must have a clear goal, a clear fail state, and a
   clear "again" moment. This is the loop most small browser games live or die on.
3. **Meta loop (across sessions).** The reason to press restart: a high score to beat, an unlock,
   a new character, a next level, a persistent upgrade. Even a single number saved to
   localStorage (best score) creates a meta loop.

A small game is allowed to have a thin meta loop, but never a missing session loop.

## Writing the loop down before coding

Fill this template in one sentence each, then build exactly that:

- Verb: the player ________ (single primary action)
- Obstacle: while ________ threatens or resists them
- Goal: to ________ (measurable: reach, survive, collect, clear)
- Feedback: success shows ________, failure shows ________
- Escalation: it gets harder because ________ increases over time
- Reason to replay: ________ (score, unlock, seed variety, next level)

If any line is blank, the game has a hole in it. The most common blank lines in AI-built games
are Escalation and Reason to replay, which is exactly why they feel flat after 20 seconds.

## Loop quality checklist

- **One primary verb.** Two verbs are a design; five verbs are an unfinished design. Add a second
  verb only after the first is fun.
- **Tension exists at all times.** Something must be able to go wrong every few seconds. No
  threat means no engagement, whatever the art looks like.
- **Failure is possible and cheap.** A game you cannot lose is a toy. A game that punishes loss
  with a 10 second wait gets closed. Death to retry should be under 2 seconds.
- **The player is always making a decision.** Holding right is not a decision. Choosing when to
  jump, which enemy to hit, which upgrade to take is.
- **Escalation is automatic.** Difficulty rises with time or progress without the player asking.
- **The loop closes.** Score feeds upgrades feed survival feeds score. Draw the arrow back to the
  start; if it does not close, the game just stops.

## Common broken loops (and the fix)

- Walking simulator with no threat, fix: add a timer, a chaser, or a resource that drains.
- Infinite spawner with flat difficulty, fix: scale spawn rate and enemy speed with elapsed time.
- Score that never means anything, fix: persist a best score and show "NEW BEST" on beat.
- Win state with nothing after it, fix: loop to a harder variant, or show a run summary and a
  restart key.
- Upgrade screen with no scarcity, fix: make the player pick 1 of 3, never buy everything.
