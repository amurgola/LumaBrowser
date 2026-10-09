# Game design: genre recipes for action games (platformer, arcade, shooter, top-down)

Each recipe gives the core loop, the minimum content for a complete-feeling build, the numbers
that matter, and the way this genre usually fails. Build the marked minimum first, then extend.

## Platformer

- Loop: move and jump through hazards toward an exit, dying and retrying cheaply.
- Minimum build: one tight controller (see the feel tuning doc), 8-12 short levels or one level
  with 5-6 challenge beats, one hazard type, one enemy type, a goal object, a level-complete and
  a death state, restart in under a second.
- Numbers: level length 30-90 seconds; checkpoint every 20-40 seconds; jump arc tuned before any
  level is built.
- Level design: one idea per level, introduced safe, then applied, then twisted. Build the level
  around the jump distance, never the other way around.
- Extensions in order: moving platforms, a second movement verb (dash, double jump, wall slide),
  collectibles per level, a timer with medals.
- Fails as: floaty jump, blind leaps of faith, instant death from off-screen threats, levels that
  are long rather than dense.

## Arcade / endless (runner, flappy, dodger, stacker)

- Loop: survive an accelerating stream of hazards, score climbs with survival, one mistake ends
  the run, instant restart.
- Minimum build: one input, a procedural hazard stream, time or distance scoring, best score in
  localStorage, a game over overlay with score and best, restart on any key.
- Numbers: run length 30 seconds to 2 minutes; difficulty ramps continuously from second 10;
  restart within 1 second; near misses should be common.
- The hook is the score: pair it with a combo or near-miss multiplier so skilled play scores
  several times higher than mere survival.
- Fails as: flat difficulty, unfair random spawns that cannot be dodged (always guarantee a
  reachable gap), no persistent best score.

## Shooter (twin-stick, bullet hell, wave shooter, space shooter)

- Loop: aim and shoot, dodge return fire, clear the wave, get stronger, face a bigger wave.
- Minimum build: responsive movement plus shooting, 2-3 enemy behaviours (chaser, shooter,
  drifter), waves with escalating counts, a weapon or power-up pickup, lives or health, and a
  boss or milestone wave.
- Numbers: chaff dies in 1-3 hits; the player takes 3-5 hits; fire rate 100-250 ms; bullet speed
  clearly faster than the fastest mover; small player hitbox (bullet hell: a few pixels, drawn).
- Enemy variety beats enemy count. Three behaviours that force different responses (approach,
  keep distance, area denial) create real decisions.
- Telegraph every attack: a wind-up flash, a laser sight, a spawn warning at the screen edge.
- Fails as: bullet soup with no readable patterns, one enemy type reskinned, no power progression
  inside a run.

## Top-down adventure / dungeon crawl

- Loop: explore a room, defeat or avoid its threats, take the reward, open the way onward.
- Minimum build: 6-10 hand-placed rooms or a small generated layout, one melee or ranged attack
  with a cooldown, two enemy types, a key or switch gate, hearts or a health bar, one boss room.
- Numbers: a room clears in 15-40 seconds; health carries between rooms; healing is scarce so
  exploration has a cost.
- Rooms should teach: a room that introduces an enemy alone, then a room that mixes it with a
  known one. Lock the door until the room is cleared so combat is not optional.
- Add a map or a breadcrumb the moment the space is bigger than two screens.
- Fails as: empty corridors, combat with no reason to move (stand and swing), backtracking with
  nothing new, no reward for exploring off the path.

## Fighting / brawler

- Loop: approach, land a combo, avoid the counter, clear the group.
- Minimum build: a light attack with a 2-3 hit chain, a knockback finisher, blocking or dodging,
  enemies that queue up rather than all attacking at once (the classic fairness trick), a wave
  structure with a mini boss.
- Numbers: attack startup 60-120 ms, recovery 150-250 ms with input buffering; hit-stop on every
  connect; enemies attack from a limited pool of attack tokens so the player is never swarmed.
- Fails as: mashing with no timing decision, enemies attacking simultaneously from off screen.

## Racing / time attack

- Loop: take the line, trade risk for speed, beat the clock or the rival, shave the record.
- Minimum build: a controller with drift or boost, one track with a ghost or a target time,
  lap and best-lap timers, medals at three thresholds.
- Numbers: lap 20-45 seconds; the target time reachable on run 3-5; a boost economy that rewards
  risky driving (drift charges boost).
- Fails as: no time pressure, no reason to take a corner tightly, a track with a single line.
