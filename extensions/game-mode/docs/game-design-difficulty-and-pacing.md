# Game design: difficulty, flow, pacing and fail states

## The flow channel

Fun lives in the band where challenge matches skill. Challenge far above skill produces anxiety
and quitting; challenge far below skill produces boredom. Player skill rises during play, so a
fixed difficulty always falls out of the channel: difficulty must rise with it.

Practical version for a browser game: the first 20 seconds are near-free, difficulty then ramps
continuously, and a competent player should reach a losing state in 2-5 minutes.

## Ramp with time, not just with levels

For endless or wave-based games, drive difficulty from elapsed time or wave index, and move more
than one knob:

```js
// src/systems/difficulty.js: one place, easy to tune
G.difficulty = (tSec) => ({
  spawnDelay: Math.max(220, 900 - tSec * 12),   // faster spawns
  enemySpeed: 60 + tSec * 2.2,                  // faster enemies
  enemyHp:    1 + Math.floor(tSec / 30),        // tougher, but slowly
  variety:    Math.min(4, 1 + Math.floor(tSec / 25)), // more enemy types
});
```

Clamp every knob. Uncapped ramps turn unwinnable in a way that reads as broken rather than hard.
Prefer adding *variety and pattern* over adding raw numbers: three enemy behaviours at moderate
speed beat one enemy at absurd speed.

## Tense and release (the oscillation rule)

Do not ramp monotonically. Alternate: give the player a new tool or a wave of easy targets right
after a hard peak so they get to feel powerful with what they just learned, then ramp again to a
higher peak. Sawtooth, rising overall.

- Peak, then a breather of 10-20 seconds (a pickup lull, a shop, a calm room).
- Put the biggest spike just before a reward, not just after one.
- Boss or milestone every few minutes gives the session a shape and a natural stopping point.

## Difficulty spikes and the failure audit

Designers are the worst judges of their own difficulty. Failing that, use instrumentation: log
where and when the player dies. If deaths cluster at one obstacle, that obstacle is a spike, not
a challenge. Fix by teaching before testing (introduce the mechanic in a safe context first),
telegraphing the threat, or lowering density rather than removing the idea.

## Fail states that keep the player playing

- **Retry in under 2 seconds.** No long death animation, no menu chain, no reload. Restart on a
  key press ("Press R" / "Click to retry") and restart the scene directly.
- **Show the cause.** A hit flash, a slow-motion beat, or a "you were hit by X" line. Deaths that
  feel random cause quitting; deaths that feel earned cause retries.
- **Show the score and the best.** The retry moment is where the meta loop gets its hook.
- **Never dead-end.** Losing must always lead back into the loop within one input.
- Soft-failure options for casual games: lose a life, drop the combo multiplier, lose progress on
  the current wave. Harsh permadeath is a genre choice, not a default.

## Readable challenge

Difficulty must come from the game, not from the presentation. Before adding challenge, verify:
- The threat is visible before it can hurt (telegraph, wind-up, spawn warning off screen edge).
- Hitboxes are forgiving: player hitbox slightly smaller than the sprite, enemy hitbox slightly
  larger. Nobody notices this except as fairness.
- Contrast: threats read at a glance against the background, and the player character is the
  highest contrast object on screen.
- Grace mechanics exist (invulnerability window after a hit, 0.5-1.5 seconds with a blink).
- No off-screen or unavoidable damage. Ever.

## Session length targets for browser games

- Arcade/endless: 60 seconds to 3 minutes per run, instant restart.
- Level-based: 30-90 seconds per level, 8-15 levels for a small complete game.
- Roguelite run: 5-15 minutes with visible mid-run milestones.
Design the first run to be short. Players judge the whole game on run one.
