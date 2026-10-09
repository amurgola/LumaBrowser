# Phaser 3: scenes and lifecycle

## Anatomy of a scene

```js
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }        // the scene key

  init(data) { this.level = data.level || 1; }   // receives scene.start payload

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.spritesheet('coin', 'assets/coin.png', { frameWidth: 32, frameHeight: 32 });
  }

  create(data) {
    this.player = this.physics.add.sprite(100, 100, 'player');
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(time, delta) {
    // called every frame; delta is ms since last frame: scale movement by it
  }
}
```

Order per scene: `init(data)` → `preload()` → `create(data)` → `update(time, delta)` loop.

## Switching and layering scenes

- `this.scene.start('Menu', { score: 42 })`: stop this scene, start another (payload lands in
  the target's `init`/`create`).
- `this.scene.restart()`: clean retry of the current scene (the standard "play again").
- `this.scene.launch('HUD')`: run another scene IN PARALLEL (HUD overlays are a scene launched
  on top of the game scene; it keeps rendering above because later-started scenes draw on top).
- `this.scene.pause('Game')` / `resume('Game')`: pause menus: launch a Pause scene, pause the
  game scene under it.
- `this.scene.stop('HUD')`: stop a parallel scene.

## The Boot scene pattern

Put EVERY `this.load.*` call in one BootScene so later scenes never race asset loading:

```js
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    // a simple progress bar
    const bar = this.add.rectangle(400, 300, 4, 24, 0xffffff);
    this.load.on('progress', (p) => { bar.width = 4 + 396 * p; });
    this.load.image('player', 'assets/player.png');
    // ... every asset the game uses
  }
  create() { this.scene.start('Menu'); }
}
```

Handle a missing/broken file gracefully: `this.load.on('loaderror', (file) => ...)`: the game
should still start (placeholder art is expected during development).

## Passing state between scenes

- Small payloads: `scene.start(key, data)`.
- Global state: a plain object on `window.G.state` (this project's convention, see
  game-patterns-state-management): scenes read/write it directly.
- `this.registry` (a game-wide DataManager) also works: `this.registry.set('score', 0)`,
  `this.registry.get('score')`, and `this.registry.events.on('changedata-score', cb)`.

## Cleanup

`this.events.on('shutdown', cb)` fires when the scene stops: remove global listeners and
timers there if you attached any outside the scene's own systems.
