# Phaser 3: arcade physics

Arcade physics is AABB (axis-aligned boxes): fast and right for almost every 2D game the
generator builds. Enable it in the game config (`physics: { default: 'arcade' }`).

## Bodies

```js
const player = this.physics.add.sprite(100, 450, 'player');  // dynamic body
player.setCollideWorldBounds(true);
player.setBounce(0.2);
player.setVelocity(160, 0);          // px/sec
player.setDrag(600);                  // deceleration
player.setMaxVelocity(300, 800);
player.body.setSize(24, 30).setOffset(4, 2);  // hitbox smaller than the sprite

const platform = this.physics.add.staticSprite(400, 568, 'ground');  // static body
// or from any game object:
this.physics.add.existing(rect, true /* isStatic */);
```

For platformers set gravity in the config (`arcade: { gravity: { y: 900 } }`); a body can
override with `body.setAllowGravity(false)` (pickups, moving platforms).

## Groups

```js
const coins = this.physics.add.group();                 // dynamic group
const platforms = this.physics.add.staticGroup();
platforms.create(400, 568, 'ground').setScale(2).refreshBody(); // refreshBody after scaling statics

coins.create(120, 80, 'coin');
// iterate: coins.children.iterate((c) => { ... })
```

Reuse instead of churn: `group.get(x, y, key)` recycles dead members (set
`{ maxSize: 30 }` on the group and `setActive(false).setVisible(false)` to release): the
standard bullet-pool pattern.

## Collisions and overlaps

```js
this.physics.add.collider(player, platforms);                  // solid contact
this.physics.add.collider(enemies, platforms);
this.physics.add.overlap(player, coins, (pl, coin) => {        // pass-through trigger
  coin.disableBody(true, true);   // remove from world + hide
  G.state.score += 10;
}, null, this);
```

- `collider` separates bodies (solid); `overlap` only fires the callback.
- Ground check for jumps: `player.body.blocked.down` (against world bounds/statics) or
  `player.body.touching.down` (against other bodies).
- One-off checks: `this.physics.overlap(a, b)` returns a boolean.

## Movement recipes

```js
// Platformer horizontal + jump
if (this.cursors.left.isDown) player.setVelocityX(-200);
else if (this.cursors.right.isDown) player.setVelocityX(200);
else player.setVelocityX(0);
if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && player.body.blocked.down) {
  player.setVelocityY(-550);
}

// Top-down 8-way (normalize the diagonal)
const v = new Phaser.Math.Vector2(
  (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0),
  (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0),
).normalize().scale(220);
player.setVelocity(v.x, v.y);

// Chase / homing
this.physics.moveToObject(enemy, player, 120);

// Aim a bullet at a point
this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
```

## World

- `this.physics.world.setBounds(0, 0, levelWidth, levelHeight)` for levels bigger than the
  screen (pair with camera bounds).
- `body.onWorldBounds = true` + `this.physics.world.on('worldbounds', cb)` to react to wall
  hits (e.g. despawn bullets).
