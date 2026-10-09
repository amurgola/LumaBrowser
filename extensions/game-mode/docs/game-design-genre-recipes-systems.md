# Game design: genre recipes for systems games (puzzle, roguelite, survivors, idle, tower defense, match)

## Puzzle

- Loop: read the board, form a hypothesis, test it, feel the click of understanding.
- Minimum build: one mechanic with clean rules, 10-15 levels ordered by idea (not by size), undo
  and restart on a key, an obvious win state, and level select so nobody gets permanently stuck.
- Design method: build the solution first, then obscure it. Introduce each rule in isolation, then
  combine rules; a single mechanic can carry dozens of levels through combination alone.
- Rules for a good puzzle: no hidden information, no execution difficulty (unless timing is the
  point), one intended insight per level, and failure is instantly undoable.
- Elegance beats volume: one mechanic explored deeply beats four shallow ones.
- Fails as: trial-and-error mazes, guess-the-designer, difficulty that comes from level count
  rather than from ideas, no undo.

## Roguelite (run-based with meta progression)

- Loop (run): fight, choose an upgrade, get stronger, face harder content, eventually die.
- Loop (meta): spend run earnings on permanent upgrades or unlocks, then run again.
- Minimum build: a 5-15 minute run, a pick-1-of-3 upgrade offer at every milestone, escalating
  enemy tiers, a death summary showing what was earned, one persistent unlock track.
- Numbers: 6-10 upgrade choices per run drawn from 15+ options so runs differ; each upgrade should
  be felt immediately (a visible change, not plus two percent).
- Make upgrades interact (fire plus spread equals a flamethrower) so builds emerge from a small
  pool. Combinatorial depth is far cheaper to build than content volume.
- Every loss must pay out: currency, an unlock, or knowledge. "Lost, gained nothing" kills the loop.
- Fails as: identical runs, meta upgrades so strong the game trivialises, or so weak they are
  invisible.

## Survivors-like (auto-attack horde)

- Loop: move to dodge, weapons fire automatically, collect XP gems, level up, pick an upgrade,
  survive a rising horde.
- Minimum build: an auto-firing starting weapon, enemies that stream toward the player, XP pickups
  with a pickup radius, a level-up overlay with 3 choices, a run timer with a boss at the end.
- Numbers: level up every 15-30 seconds early, stretching later; enemy counts grow from a handful
  to hundreds (cap on-screen sprites); the player feels weak at 1 minute and absurd at 10.
- Movement is the only skill expression, so enemy formations (waves, rings, walls) are the level
  design.
- Fails as: no power fantasy curve (upgrades too small), no pressure (enemies too slow to force
  movement), performance collapse from uncapped spawns.

## Idle / clicker

- Loop: earn currency, buy a producer or upgrade, earn faster, unlock the next tier.
- Minimum build: a click action, 4-6 producers on an exponential cost curve, accrual that keeps
  running while the tab sits idle, and a prestige reset granting a permanent multiplier.
- Numbers: cost multiplier per purchase around 1.07-1.15; each new producer roughly 5-10x the
  previous output; the next purchase should always be visibly close, never more than a couple of
  minutes away early on.
- Prestige when progress crawls (commonly the first reset at 30-60 minutes), with a multiplier
  that makes the replay 5-10x faster.
- Format big numbers (K/M/B suffixes) and always show the rate per second.
- Fails as: dead time with nothing to press, a wall with no prestige, unreadable numbers.

## Tower defense

- Loop: read the incoming wave, place and upgrade towers within a budget, watch it resolve, adapt.
- Minimum build: one path, 3 tower types with distinct roles (single target, area, slow), 10-15
  waves whose composition forces variety, an economy from kills, a wave preview, and a bonus for
  calling the next wave early.
- Numbers: build phase 10-20 seconds between waves; a tower pays for itself within 2-3 waves;
  leaks cost lives (10-20 total) rather than instant defeat.
- Design waves as questions: a fast swarm asks for area damage, an armored single asks for single
  target, a mixed wave asks for both.
- Fails as: one dominant tower, no reason to place a second type, no preview so planning is luck.

## Match / merge

- Loop: spot a pattern, make the match, watch the cascade, chase a goal under a limit.
- Minimum build: a grid with valid-move detection, cascade resolution, a goal (score, clear tiles,
  collect N), a limit (moves or time), and a reshuffle when no moves remain.
- Numbers: 20-40 moves per level; cascades common enough to feel lucky, rare enough to feel
  earned; a special tile created at 4+ matches keeps mastery visible.
- Never let the board deadlock, and always animate the cascade so the player sees the causality.
- Fails as: no goal variety, no special tiles, board states that soft-lock.

## Simulation / management

- Loop: observe a state, spend a limited resource, watch consequences unfold, correct course.
- Minimum build: 2-3 interacting resources, a tick that advances the sim, a visible failure
  condition (bankruptcy, starvation, collapse), and a readable dashboard.
- Numbers: a tick every 0.5-2 seconds; a decision worth making at least once every 10 seconds;
  consequences visible within 2-3 ticks so cause and effect stay learnable.
- Fails as: opaque math, a dominant strategy, nothing to do between ticks.
