class PhaserLintRules {
  static RULES = [
    {
      id: 'geom-path',
      re: /\bPhaser\.Geom\.Path\b/g,
      message: 'Phaser.Geom.Path does not exist in Phaser 3; this throws. Draw the shape on a Graphics '
        + 'object instead: beginPath()/moveTo()/lineTo()/arc()/closePath() then fillPath(), or use '
        + 'fillCircle/fillTriangle/fillRect.',
    },
    {
      id: 'fillpath-arg',
      re: /\.(fillPath|strokePath)\(\s*[^)\s]/g,
      message: (m) => `Graphics.${m[1]}() takes NO arguments: it fills/strokes the path already built on `
        + 'that Graphics object via beginPath()/moveTo()/lineTo()/arc(). Passing a path object here is wrong.',
    },
    {
      id: 'body-refresh',
      re: /\.body\.refresh\s*\(/g,
      message: 'Arcade bodies have no refresh(): TypeError at runtime. After moving a static object call '
        + 'gameObject.refreshBody(), or body.updateFromGameObject().',
    },
    {
      id: 'keyevent-concat',
      re: /['"]key(?:down|up)-['"]\s*\+/g,
      message: "'keydown-' + KeyCodes.X builds an event name like 'keydown-32', which Phaser never emits; "
        + "the handler silently never fires. Use the key NAME ('keydown-SPACE'), or addKey() + "
        + 'Phaser.Input.Keyboard.JustDown(key) in update().',
    },
    {
      id: 'v2-game-global',
      re: /\bgame\.(add|load|physics|state|camera|world)\./g,
      message: (m) => `game.${m[1]}.* is Phaser 2 API. In Phaser 3 you work inside a Scene: this.add / `
        + 'this.load / this.physics / this.cameras / this.scene.',
    },
    {
      id: 'v2-anchor',
      re: /\.anchor\.(set|setTo)\s*\(/g,
      message: 'sprite.anchor is Phaser 2 API; Phaser 3 uses sprite.setOrigin(x, y).',
    },
    {
      id: 'v2-arcade-const',
      re: /\bPhaser\.Physics\.ARCADE\b/g,
      message: 'Phaser.Physics.ARCADE is a Phaser 2 constant. Phaser 3 selects physics in the game config: '
        + "physics: { default: 'arcade', arcade: { … } }.",
    },
    {
      id: 'v2-keyboard-isdown',
      re: /\bkeyboard\.isDown\s*\(/g,
      message: 'keyboard.isDown(...) is Phaser 2 API. In Phaser 3 create keys (addKey / createCursorKeys) '
        + 'and read key.isDown, or use this.input.keyboard.checkDown(key, duration).',
    },
    {
      id: 'stroke-arg-order',
      re: /\.(setStrokeStyle|lineStyle)\s*\(\s*(0[xX][0-9a-fA-F]{3,}|[1-9]\d{2,})\s*[,)]/g,
      message: (m) => `${m[1]}(${m[2]}, …) puts a COLOUR where the line WIDTH goes. The signature is `
        + `${m[1]}(lineWidth, color, alpha), width first, so this draws a ${PhaserLintRules._number(m[2]).toLocaleString()}px-wide `
        + 'near-black stroke that covers the whole screen (the "black screen with only the HUD showing" bug). '
        + `Write ${m[1]}(2, ${m[2]}, 1) instead.`,
    },
    {
      id: 'v2-constructor',
      re: /\bnew\s+Phaser\.(Sprite|Image|Text|Graphics|Group|BitmapText)\s*\(/g,
      message: (m) => `new Phaser.${m[1]}(...) is Phaser 2 API. Phaser 3 game objects live under `
        + `Phaser.GameObjects.${m[1]} (extend that in a class) or are created via this.add.* / `
        + 'this.physics.add.*.',
    },
  ];

  static _number(literal) {
    return parseInt(literal, literal.startsWith('0') ? 16 : 10);
  }
}

module.exports = PhaserLintRules;
