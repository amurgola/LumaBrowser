# Game patterns: game feel ("juice") and procedural audio

A mechanically-correct game feels dead without feedback. Every player action and every
important event should produce at least one immediate, visible (or audible) reaction. These
are the cheap, high-impact tools: all standard Phaser, no assets required.

## The checklist

For each of: player action (jump/shoot/click), success (hit/collect/score), failure
(damage/death/miss): add at least one of:

- **Camera shake**: `this.cameras.main.shake(120, 0.008)` on impacts/explosions. Scale with
  severity; never shake on routine actions.
- **Flash/fade**: `cam.flash(100)` on damage taken; `cam.fade(400)` into game over.
- **Hit-stop**: freeze the action for a few frames on a big hit:
  `this.physics.pause(); this.time.delayedCall(60, () => this.physics.resume());`
- **Squash & stretch** (tween scale): land → `{ scaleX: 1.25, scaleY: 0.75, duration: 90, yoyo: true }`;
  jump → the inverse.
- **Score pop**: tween the HUD text scale up 1.2-1.4x and back (80-120 ms) whenever it changes;
  spawn a floating `+10` text at the pickup that tweens up and fades.
- **Tint flicker on damage**: `sprite.setTint(0xff4444)` then clear after 100 ms; pair with a
  short alpha-blink invulnerability window.
- **Particles**: a single 4x4 white texture, tinted, covers explosions, sparkles, dust, trails
  (see phaser3-sprites-tweens-particles).
- **Ease everything**: menus and popups enter with `Back.easeOut`, not linearly.

Two or three of these, consistently applied, transform how a game reads. Add them WITH the
mechanic, not as a polish pass at the end.

## Procedural audio (WebAudio: the only audio in this project)

No audio files can be generated here, so synthesize. One tiny module covers a whole game:

```js
// src/systems/audio.js
window.G = window.G || {};
(function () {
  let ctx = null;
  const ac = () => (ctx = ctx || new (window.AudioContext || window.webkitAudioContext)());

  // One general-purpose blip: type, frequency glide, duration, volume.
  function tone({ type = 'square', from = 440, to = from, dur = 0.08, vol = 0.2 }) {
    if (!G.state || !G.state.settings || !G.state.settings.sound) return;
    try {
      const a = ac();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(from, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(Math.max(1, to), a.currentTime + dur);
      g.gain.setValueAtTime(vol, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + dur);
    } catch (_) { /* audio is never allowed to crash the game */ }
  }

  G.sfx = {
    jump:   () => tone({ type: 'square',   from: 300, to: 620, dur: 0.10 }),
    coin:   () => tone({ type: 'triangle', from: 900, to: 1400, dur: 0.09 }),
    hit:    () => tone({ type: 'sawtooth', from: 220, to: 60,  dur: 0.18, vol: 0.3 }),
    click:  () => tone({ type: 'square',   from: 700, to: 700, dur: 0.04, vol: 0.12 }),
    lose:   () => tone({ type: 'sawtooth', from: 300, to: 40,  dur: 0.5,  vol: 0.25 }),
  };
})();
```

- Browsers block audio until the first user gesture: the AudioContext is created lazily on
  first use, which a click/keypress-triggered sound satisfies naturally.
- Route every sound through the settings flag so mute is one boolean.
- Noise (explosions): fill an AudioBuffer with `Math.random() * 2 - 1` and play it through a
  gain envelope; lowpass-filter it for rumble.

## Difficulty and pacing

- Ramp ONE variable (spawn rate, speed, gap size) smoothly with elapsed time or score:
  `const speed = 200 + Math.min(300, score * 4)`.
- Give the player a beat to breathe after a near-miss or level-up (0.5-1 s spawn pause).
- Show the state of the ramp (level number, speed lines) so difficulty feels earned, not random.
