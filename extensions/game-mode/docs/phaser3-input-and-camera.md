# Phaser 3: input and camera

## Keyboard

```js
// In create():
this.cursors = this.input.keyboard.createCursorKeys();  // up/down/left/right/space/shift
this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,ENTER,ESC');
const jump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

// In update():
if (this.keys.A.isDown) { ... }                          // held
if (Phaser.Input.Keyboard.JustDown(jump)) { ... }        // edge-triggered (fires once per press)

// Event style (menus):
this.input.keyboard.on('keydown-ENTER', () => this.scene.start('Game'));
```

`JustDown` is the right tool for jump/shoot/confirm: checking `isDown` fires every frame.

## Pointer (mouse + touch: same API)

```js
this.input.on('pointerdown', (pointer) => { /* pointer.x, pointer.y, pointer.worldX/Y */ });
this.input.on('pointermove', (pointer) => { paddle.x = pointer.x; });

// Per-object interactivity:
sprite.setInteractive({ useHandCursor: true });
sprite.on('pointerdown', () => { ... });
sprite.on('pointerover', () => sprite.setTint(0xdddddd));
sprite.on('pointerout', () => sprite.clearTint());
```

One-button games: treat `pointerdown` anywhere AND a key as the same action so the game plays
on both desktop and touch:

```js
const press = () => this.flap();
this.input.on('pointerdown', press);
this.input.keyboard.on('keydown-SPACE', press);
```

## Camera

```js
const cam = this.cameras.main;
cam.setBounds(0, 0, levelWidth, levelHeight);   // pair with physics.world.setBounds
cam.startFollow(player, true, 0.12, 0.12);      // lerped follow (roundPixels, lerpX, lerpY)
cam.setDeadzone(120, 80);                       // player moves freely inside this box
cam.setZoom(2);                                 // pixel-art often runs zoomed

// Effects (great cheap game feel):
cam.shake(150, 0.01);                           // duration ms, intensity
cam.flash(120, 255, 255, 255);                  // white flash
cam.fade(400, 0, 0, 0);                         // fade to black
cam.once('camerafadeoutcomplete', () => this.scene.start('GameOver'));
```

## HUD that doesn't scroll

Any object pinned to the screen: `text.setScrollFactor(0)` (and usually `setDepth(100)`).
For bigger games, run the HUD as a parallel scene (`this.scene.launch('HUD')`): it has its own
camera and never scrolls (see phaser3-scenes-lifecycle).

## Screen vs world coordinates

With a moving camera, `pointer.x/y` are SCREEN coords; use `pointer.worldX/worldY` (or
`cam.getWorldPoint(pointer.x, pointer.y)`) when aiming at things in the world.
