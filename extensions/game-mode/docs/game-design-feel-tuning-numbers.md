# Game design: concrete feel tuning numbers (jump, input, hit reaction)

Starting values that feel right, so a first build is never floaty or mushy. All are Phaser 3
Arcade Physics, pixels and milliseconds. Tune from here, do not invent from zero.

## Platformer jump (the single most judged mechanic)

- Time to apex: 300-450 ms. Longer reads as floaty, shorter as twitchy.
- Jump height: 2.5 to 3.5 times the player's height. Max horizontal jump distance: 4-6 body widths.
- **Asymmetric gravity**: falling gravity 1.5x to 2.5x the rising gravity. This one change is the
  difference between "moon" and "arcade".
- Run speed 160-260 px/s for a 32 px character; acceleration to full speed in 60-120 ms; ground
  friction stops in 60-100 ms; air control at 60-80 percent of ground control.

```js
// rise vs fall gravity, variable jump height, coyote time, jump buffer
const JUMP_V = -420, GRAV = 900, FALL_MULT = 2.0, CUT_MULT = 0.45;
const COYOTE = 100, BUFFER = 120; // ms

update(time, delta) {
  const b = this.player.body;
  if (b.blocked.down) this.lastGrounded = time;
  if (Phaser.Input.Keyboard.JustDown(this.jumpKey)) this.lastJumpPress = time;

  const grounded = time - (this.lastGrounded || -1e9) <= COYOTE;
  const buffered = time - (this.lastJumpPress || -1e9) <= BUFFER;
  if (grounded && buffered) {
    b.setVelocityY(JUMP_V);
    this.lastJumpPress = -1e9; this.lastGrounded = -1e9; // consume both
  }
  // variable height: release early, cut the rise
  if (b.velocity.y < 0 && !this.jumpKey.isDown) b.velocity.y *= CUT_MULT;
  // heavier fall
  b.setGravityY(b.velocity.y > 0 ? GRAV * (FALL_MULT - 1) : 0);
}
```

- Coyote time (jump still works just after leaving a ledge): tight precision 70-100 ms, action
  platformer 90-140 ms, casual 110-170 ms.
- Jump buffer (jump pressed just before landing still fires): 70-110 / 100-150 / 120-180 ms on
  the same scale.
Neither makes the game easier in a cheap way; they remove inputs the game wrongly ignored.

## Input responsiveness in general

- Any action must produce a visible reaction within 1-2 frames. Never gate the player's own
  action behind an animation.
- Buffer the next input during a short recovery (attack, dash) for 100-150 ms so combos chain.
- Dash: 120-200 ms of travel, 300-600 ms cooldown, brief invulnerability if it is a defensive tool.
- Shooting: 100-250 ms between shots for a primary weapon; add 1-3 degrees of spread and a
  10-30 ms muzzle flash so it does not read as a spreadsheet.

## Hit reactions (make contact matter)

- Hit-stop: freeze 40-80 ms on a heavy hit (`this.physics.pause()` then resume via
  `this.time.delayedCall`). Do not use it on every trivial hit.
- Knockback: 120-260 px/s away from the impact, decaying within 150 ms.
- Damage flash: `setTint(0xff4444)` for 80-120 ms, then `clearTint()`.
- Invulnerability after taking damage: 600-1200 ms with an alpha blink at about 10 Hz.
- Camera shake: 80-150 ms at intensity 0.004-0.01 for impacts; 200-300 ms at 0.015-0.02 for a
  death or explosion. Never shake on routine movement.
- Screen flash on player damage: `cam.flash(80, 255, 40, 40)`.

## Tween and timing constants that read as "polished"

- UI element enters: 180-260 ms, `Back.easeOut`. Exits: 120-180 ms, `Quad.easeIn`.
- Score pop: scale to 1.25 over 90 ms, yoyo.
- Floating "+10" text: rise 30 px and fade over 500-700 ms.
- Pickup: scale 0 to 1 over 150 ms with a small rotation; collect with a 120 ms shrink and fade.
- Scene transition fade: 250-400 ms. Anything above 600 ms feels like waiting.

## Spawn and density defaults for wave games

- First enemy within 2-3 seconds of the run starting; the player is never staring at nothing.
- Starting spawn interval 800-1000 ms, decaying to a floor around 200-250 ms.
- On-screen enemy cap: keep it (30-60 for simple sprites) or the frame rate becomes the difficulty.
- Pickup drop chance 10-25 percent on kill, with a pity rule (guaranteed drop if none for N kills)
  so a cold streak does not end a run.

## Frame-rate independence

Multiply movement you apply manually by `delta / 16.666` (or use physics velocities, which Phaser
already integrates by time). Timers belong in `this.time.addEvent`, never in a frame counter.
