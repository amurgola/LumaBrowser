# Game design: progression, rewards, incentives and economy math

Progression is the promise that the next minute is worth playing. Rewards are how the game keeps
that promise. Both are cheap to add and are the single biggest upgrade to a bare prototype.

## Intrinsic vs extrinsic motivation

- **Intrinsic**: mastery (I got better), curiosity (what is in the next room), expression (my
  build, my style), completion (I cleared it). Costs nothing to implement and never wears off.
- **Extrinsic**: points, coins, stars, unlocks, badges. Cheap to add, powerful early, and prone
  to the over-justification effect: heavy extrinsic reward can crowd out intrinsic enjoyment, so
  it should decorate a loop that already feels good rather than replace it.

Rule for small games: make the verb satisfying first (intrinsic), then layer a score and one
unlock track (extrinsic). Never ship reward spam over a hollow mechanic.

## Reward cadence

- Something rewarding should happen roughly **every 5-20 seconds** of moment-to-moment play
  (a pickup, a kill, a combo tick, a score pop).
- A **new thing** (mechanic, enemy type, tier, environment) should appear roughly **every 60-90
  seconds** in the first ten minutes, or attention drops.
- Mix reward types: aesthetic (an effect, a color shift), mechanical (a new move or weapon),
  informational (a number goes up, a bar fills), and status (best score, rank, medal).
- Variable-ratio rewards (random drops) are stickier than fixed ones, but must never gate
  progress: randomness decorates progress, it does not control it.

## Progression curves that work

- **Linear** (level N costs N * k): flat, fair, feels stale after a while. Fine for a 10 level
  browser game.
- **Exponential** (cost = base * r^N, r around 1.15-1.6): the standard for upgrades and XP. It
  makes early progress fast and late progress a deliberate goal. Idle games sit at r ≈ 1.07-1.15
  for fine-grained buying, action games at r ≈ 1.3-1.6 for a handful of meaningful tiers.
- **Stepped/tiered**: cheap upgrades punctuated by an expensive milestone unlock. Best of both,
  and easy to tune by hand for small games.

Sanity numbers for a short session game: first upgrade affordable within 20-30 seconds; three to
five upgrades reachable in a 3 minute run; the top tier reachable only in an exceptional run.

## Power and enemy scaling (keep the fight honest)

Pick a target time-to-kill (TTK) and time-to-die and hold them roughly constant as both sides
grow. If player DPS grows 1.5x per tier, enemy HP should grow near 1.4-1.6x per matching tier.
- TTK for chaff: 1-3 hits. For elites: 5-10. For a boss: 20-40 seconds of sustained play.
- Player survivability: at least 3 mistakes before death in a casual game, 1-2 in a hardcore one.
- If enemy HP outruns player damage, the game turns spongy and boring; if damage outruns HP, the
  game trivialises. Compute both curves in the same place in code so they stay visible.

## Economy: faucets and sinks

Every currency needs a **faucet** (how it enters: kills, pickups, time) and a **sink** (how it
leaves: upgrades, revives, rerolls, consumables). The most common failure is inflation: income
sources are added and sinks are not, so the player ends the run rich and bored.
- Keep exactly one currency in a small game. Two currencies need two full economies.
- Target: the player should be able to afford a purchase most of the time, but never all
  purchases at once. Scarcity is what makes a choice a choice.
- Prefer "pick 1 of 3" offers over open shops: they are cheaper to build, force a decision, and
  create run variety for free.

## Meta progression (the reason to press restart)

Cheapest meaningful options, in order of effort:
1. Persist a **best score** in localStorage and celebrate beating it.
2. Persist **totals** (runs played, enemies defeated) and unlock a cosmetic or a start bonus at
   thresholds.
3. Persist **permanent upgrades** bought with a run-earned currency (roguelite style): each run
   contributes even when it ends badly, which converts failure into progress.
4. Persist **unlocked characters/modes** that change how the core loop plays, not just numbers.

Design meta progression so a loss still pays out. "You lost and gained nothing" is the fastest
way to make a player stop.
