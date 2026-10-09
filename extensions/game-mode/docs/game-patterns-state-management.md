# Game patterns: state management (this project's convention)

Games in this project use classic scripts and ONE global namespace `window.G`. State lives in
`src/systems/state.js`, loaded before every scene.

## The state module

```js
// src/systems/state.js
window.G = window.G || {};

G.state = {
  // Run state (reset every new game)
  score: 0,
  lives: 3,
  level: 1,
  // Meta state (persists across runs via save/load)
  best: 0,
  unlocked: ['level1'],
  settings: { sound: true },
};

G.resetRun = function () {
  G.state.score = 0;
  G.state.lives = 3;
  G.state.level = 1;
};

const SAVE_KEY = 'game-save-v1';

G.save = function () {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      best: G.state.best,
      unlocked: G.state.unlocked,
      settings: G.state.settings,
    }));
  } catch (_) { /* storage may be unavailable; the game must still run */ }
};

G.load = function () {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (typeof d.best === 'number') G.state.best = d.best;
    if (Array.isArray(d.unlocked)) G.state.unlocked = d.unlocked;
    if (d.settings) Object.assign(G.state.settings, d.settings);
  } catch (_) { /* corrupt save: start fresh, never crash */ }
};
```

Rules:
- Separate RUN state (reset each game) from META state (persisted). Only meta state is saved.
- Version the save key (`-v1`); when the shape changes incompatibly, bump it rather than
  writing migration code.
- Every localStorage touch goes through try/catch: the game must boot with storage blocked.
- Call `G.load()` once at boot (BootScene.create), `G.save()` at natural points (game over,
  new best, setting changed): not every frame.

## Using state from scenes

```js
// GameOverScene
create() {
  if (G.state.score > G.state.best) { G.state.best = G.state.score; G.save(); }
  this.add.text(400, 200, `Score ${G.state.score}  Best ${G.state.best}`).setOrigin(0.5);
}
// Restart
G.resetRun();
this.scene.start('Game');
```

## Reactive updates without a framework

For HUD text that tracks a value, either set it where the value changes (simplest, preferred)
or use Phaser's registry as an event bus:

```js
this.registry.set('score', G.state.score);            // whenever it changes
this.registry.events.on('changedata-score', (_, v) => hudText.setText('Score ' + v));
```

Keep it simple: direct "change value → update the one label" beats a general system in a small
game.

## What NOT to do

- No state inside scene instances that must survive `scene.restart()`: restart rebuilds the
  scene; anything that must survive belongs in `G.state`.
- No JSON blobs inside sprite objects; entities read/write `G.state` fields.
- Never store Phaser objects in `G.state` (they die with their scene): store plain data.
