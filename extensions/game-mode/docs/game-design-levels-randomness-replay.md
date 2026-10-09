# Game design: level design, randomness and replayability

## Level design as a sequence of questions

A level is a series of questions the player answers with the verb. Design each beat by naming the
question ("can you jump while dodging?") and the answer the player must find. A level with no
question is a corridor.

- **One idea per level, three beats per idea**: safe introduction, pressured application,
  combination or twist (see the onboarding doc).
- **Density over length.** Cut travel time. If the player is holding a direction with nothing
  happening for more than three seconds, delete that stretch.
- **Rhythm.** Alternate high-intensity beats with short recoveries so the peaks land.
- **Sightlines.** The player must see a threat or a landing spot before committing. Never require
  memorisation of something invisible.
- **The reward is where the risk was.** Put collectibles on the harder path, not on the safe one.
- **End on a high.** Close a level with the most confident, most powerful expression of its idea.

For a small game, 8-12 levels of 30-90 seconds is a complete arc: 2 teaching, 6 developing, 2
combining, 1 finale.

## Data-driven levels

Define levels as data, not as code, so tuning does not mean rewriting scenes:

```js
// src/systems/levels.js
G.LEVELS = [
  { id: 1, goal: 'reach', time: 45, platforms: [[100, 500, 200], [340, 430, 120]],
    enemies: [{ type: 'walker', x: 380, y: 400 }], pickups: [[360, 380]] },
  // ...
];
```

One GameScene reads the entry for the current level index. Adding content becomes adding rows,
which is where a game gets big cheaply. The same idea covers waves, rooms, and upgrade tables.

## Randomness that stays fair

Random content is the cheapest source of replay value and the easiest way to make a game feel
broken. Constrain it.

- **Guarantee solvability.** Generated gaps must be jumpable, generated rooms reachable, generated
  boards must have a legal move. Validate after generating and regenerate on failure.
- **No unavoidable damage.** Never spawn a hazard on top of the player or just off screen at speed.
  Keep a safe radius around the player and a minimum reaction distance for anything incoming.
- **Weight and smooth.** Pure uniform randomness clumps. Use a bag (shuffle a list, deal it out
  before reshuffling) so the player never gets the same pickup five times or waits ten spawns for
  a needed one.
- **Pity timers.** Guarantee a drop if none has occurred in N attempts. Streaks of nothing feel
  like a bug.
- **Seeded runs.** Keep the seed so a run can be replayed or shared:
  `const rng = new Phaser.Math.RandomDataGenerator([String(seed)])`, and use `rng.between`,
  `rng.pick`, `rng.frac` everywhere instead of Math.random. This also makes bugs reproducible.
- **Random the interesting parts, fix the fundamentals.** Randomise layout, order, and modifiers.
  Do not randomise the controls, the pacing floor, or the win condition.

## Sources of replay value, cheapest first

1. A persisted best score and a visible target to beat.
2. Escalating endless mode after the last level.
3. Randomised layouts or wave orders per run.
4. Pick-1-of-3 upgrades drawn from a larger pool so builds differ.
5. Unlockable characters or starting weapons that change the loop, not just numbers.
6. Modifiers or challenge runs (no damage, double speed, one life) toggled from the menu.
7. Daily seed: the same generated run for everyone on a given date.

## Emergence beats content

Systems that interact produce more play than assets do. Fire spreads to grass, ice makes floors
slippery, explosive barrels chain, an upgrade that adds pierce changes every weapon. Three
systems that combine give more variety than thirty hand-built rooms, and cost less to build.
When asked to make a game "bigger", prefer adding an interacting system over adding content.
