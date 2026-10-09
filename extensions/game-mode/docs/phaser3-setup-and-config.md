# Phaser 3: game setup and configuration

## The game config

```js
const config = {
  type: Phaser.AUTO,            // WebGL with Canvas fallback
  parent: 'game',               // id of the DOM element to mount into
  width: 800,
  height: 600,
  backgroundColor: '#10131a',
  scale: {
    mode: Phaser.Scale.FIT,     // scale the canvas to fit the window, keep aspect
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },  // y: 800-1200 for platformers
  },
  pixelArt: true,               // set for pixel-art games: crisp nearest-neighbour scaling
  scene: [BootScene, MenuScene, GameScene],  // first entry starts automatically
};
const game = new Phaser.Game(config);
```

Notes:
- `scene` takes scene CLASSES (or instances); the FIRST one starts automatically.
- Pick one logical resolution (e.g. 800x600 or 960x540) and design everything to it;
  `Scale.FIT` handles real window sizes.
- `pixelArt: true` disables texture smoothing globally: use it whenever assets are pixel art.
- `Phaser.Scale.RESIZE` exists but forces you to handle relayout; FIT is almost always the
  right default for generated games.

## Scale modes quick reference

- `Phaser.Scale.FIT`: letterbox to fit, keeps aspect ratio (default choice).
- `Phaser.Scale.ENVELOP`: cover the area, may crop.
- `Phaser.Scale.RESIZE`: canvas tracks the parent size; scene must reposition on resize.

## Registering many scenes

Scenes can also be added at runtime: `this.scene.add('Key', SceneClass, false)` then
`this.scene.start('Key')`. For generated games prefer listing every scene in the config:
it keeps the wiring visible in one place (src/main.js).

## Common startup mistakes

- Creating the game before the scene classes are defined: keep `new Phaser.Game(config)` in
  the LAST script tag (src/main.js) and every scene file before it.
- Forgetting `parent`: the canvas lands at the end of `<body>` and CSS centering breaks.
- Loading assets outside `preload()`: textures silently miss and sprites render as green boxes.
