# Phaser 3: sprites, animation, tweens, particles

## Sprites and textures

```js
this.add.image(x, y, 'bg');                      // static, no physics
const s = this.add.sprite(x, y, 'player');       // animatable, no physics
const p = this.physics.add.sprite(x, y, 'player'); // animatable + arcade body

s.setOrigin(0.5);        // default; 0,0 = top-left anchoring
s.setScale(2);
s.setFlipX(true);        // face the other way (cheaper than a second texture)
s.setDepth(10);          // draw order (higher = on top)
s.setTint(0xff5555);     // colour multiply; clearTint() to reset
s.setAlpha(0.5);
```

No-texture shapes are first-class and perfect for placeholders and UI:
`this.add.rectangle(x, y, w, h, 0x60a5fa)`, `this.add.circle(x, y, r, color)`,
`this.add.graphics()` for custom drawing. `this.physics.add.existing(rect)` gives them bodies.

## Spritesheet animations

```js
// preload:
this.load.spritesheet('hero', 'assets/hero.png', { frameWidth: 32, frameHeight: 48 });
// create (define ONCE: anims are global; guard with this.anims.exists):
if (!this.anims.exists('run')) {
  this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 5 }),
    frameRate: 12,
    repeat: -1,           // loop forever
  });
}
sprite.play('run');
sprite.play('jump', true);  // ignoreIfPlaying
sprite.on('animationcomplete-die', () => sprite.destroy());
```

Generated single-frame assets can still feel alive with tweens (below): squash on land,
tilt on turn: no spritesheet needed.

## Tweens (the workhorse of game feel)

```js
this.tweens.add({
  targets: sprite,
  y: sprite.y - 12,
  duration: 120,
  ease: 'Quad.easeOut',
  yoyo: true,               // return to start
  repeat: 0,                // -1 = forever
  onComplete: () => { ... },
});

// Score pop
this.tweens.add({ targets: scoreText, scale: 1.3, duration: 80, yoyo: true });

// Pulse forever
this.tweens.add({ targets: title, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

// Counter tween (numbers, not properties)
this.tweens.addCounter({ from: 0, to: 100, duration: 500,
  onUpdate: (tw) => text.setText(Math.floor(tw.getValue())) });
```

Common eases: `'Linear'`, `'Quad.easeOut'`, `'Back.easeOut'` (overshoot), `'Bounce.easeOut'`,
`'Sine.easeInOut'`.

## Timers

```js
this.time.delayedCall(800, () => this.spawnEnemy());
const loop = this.time.addEvent({ delay: 1500, loop: true, callback: this.spawnEnemy, callbackScope: this });
loop.remove();            // stop it
```

Difficulty ramps: keep the delay in state and recreate the event, or check elapsed time in
`update` and scale spawn rates.

## Particles

```js
// A one-shot burst (explosion, coin sparkle) using any small texture:
const emitter = this.add.particles(x, y, 'spark', {
  speed: { min: 80, max: 220 },
  angle: { min: 0, max: 360 },
  lifespan: 500,
  scale: { start: 1, end: 0 },
  quantity: 16,
  emitting: false,
});
emitter.explode(16, x, y);
```

A 4x4 white square texture tinted per-use covers most particle needs: generate one tiny
asset and reuse it everywhere with `tint`.

## Shapes: fill and stroke argument order

`this.add.rectangle()/circle()/…` return Shape objects. Their style setters are:

```js
rect.setFillStyle(color, alpha);            // colour first
rect.setStrokeStyle(lineWidth, color, alpha); // WIDTH first
graphics.lineStyle(lineWidth, color, alpha);  // WIDTH first
```

A colour passed as the first argument of `setStrokeStyle` / `lineStyle` becomes the line width:
`setStrokeStyle(0x6b5a34, 2)` is a 7,035,444-pixel-wide stroke in colour `#000002`, which paints
over everything drawn before that object. The symptom is a black screen with no runtime errors
where only objects drawn AFTER the offending one (typically a HUD) are visible.

## Containers position children relative to themselves

```js
class NPC extends Phaser.GameObjects.Container {
  constructor(scene, x, y, key) {
    super(scene, x, y);
    const img = scene.add.image(0, 0, key);   // (0, 0) = the container's own x/y
    this.add(img);                            // never also set img.x = x
    scene.add.existing(this);
  }
}
```
