const GameScaffold = require('../session/GameScaffold');

class GamePromptBlocks {
  static GAME_PROJECT = `<game_project>
You are building a browser game as plain files in a dedicated game folder. All tool paths are
relative to that folder. The REQUIRED layout and conventions:

- game.json      : { "name", "version", "entry": "index.html" }. Keep "name" updated.
- index.html     : loads Phaser FIRST, then your scripts as CLASSIC <script> tags in dependency
  order: state → entities → systems → ui → scenes → main. NO ES modules, NO import/export, NO
  bundlers. Phaser is ALREADY INSTALLED at ${GameScaffold.PHASER_URL}; use exactly:
    <script src="${GameScaffold.PHASER_URL}"></script>
  Never load Phaser (or anything else) from a CDN, and never reference npm.
- src/main.js    : creates the Phaser.Game with its config and scene list. Runs last.
- src/scenes/    : one class per scene. BootScene (preloads every asset), MenuScene, GameScene, …
- src/entities/  : game-object classes (Player, Enemy, …) extending Phaser classes.
- src/systems/   : logic shared across scenes. src/systems/state.js defines the single global
  game state object + save/load via localStorage.
- src/ui/        : REUSABLE UI components (Button, HUD, DialogBox). Build UI from these instead
  of ad-hoc per-scene text objects, so screens stay consistent.
- assets/        : images from generate_asset. Load with RELATIVE paths ("assets/player.png").

Because there are no modules, share code through ONE global namespace: window.G = window.G || {}
and attach classes/state to it (G.Player, G.state, …). Each file guards its own attachment.
</game_project>`;

  static PHASER_GROUNDING = `<phaser_grounding>
Phaser 3 facts (use these EXACTLY; do not invent Phaser APIs; when unsure, search the knowledge
base first):
- Game config: new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width, height,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: [G.BootScene, G.MenuScene, G.GameScene] }).
- A scene is a class extending Phaser.Scene; constructor calls super('SceneKey'); lifecycle is
  preload() → create(data) → update(time, delta). Switch scenes with this.scene.start('Key', data).
- Load assets ONLY in preload(): this.load.image('player', 'assets/player.png');
  this.load.spritesheet(key, url, { frameWidth, frameHeight }).
- Arcade physics: this.physics.add.sprite(x, y, key); body flags like sprite.body.setVelocity /
  setCollideWorldBounds(true); this.physics.add.collider(a, b, onHit) and
  this.physics.add.overlap(a, b, onOverlap); groups via this.physics.add.group().
- Input: this.cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  Phaser.Input.Keyboard.JustDown(key); pointer via this.input.on('pointerdown', cb).
- Text/UI: this.add.text(x, y, str, { fontSize: '24px', color: '#fff' }); setOrigin(0.5);
  setScrollFactor(0) to pin HUD to the camera.
- Camera: this.cameras.main.startFollow(sprite); setBounds(0, 0, w, h); shake(duration, intensity).
- Tweens: this.tweens.add({ targets, props…, duration, ease, yoyo, repeat, onComplete }).
- After moving a STATIC body, call img.refreshBody() (there is NO body.refresh()). Shapes from
  this.add.rectangle()/circle() use setFillStyle(color, alpha) and setStrokeStyle(lineWidth,
  color, alpha): the LINE WIDTH comes FIRST; setStrokeStyle(0x6b5a34, 2) makes a 7-million-pixel
  stroke that paints the whole screen black. Same order on Graphics: lineStyle(lineWidth, color,
  alpha); fillStyle()/lineStyle() exist ONLY on Graphics. Phaser.Geom.Path does not exist; build
  Graphics paths with beginPath()/moveTo()/lineTo()/arc() then fillPath() with no arguments.
- A Container positions its children RELATIVE to itself: a child created at (0, 0) sits at the
  container's own x/y. Never also set child.x = containerX; that doubles the offset and puts it
  off-screen.
- Timers: this.time.addEvent({ delay, loop: true, callback, callbackScope: this }).
- Audio: generate it procedurally with the WebAudio API (a small src/systems/audio.js); there is
  NO audio-file generation here, so never this.load.audio a file you cannot create.
</phaser_grounding>`;

  static KNOWLEDGE = `<knowledge_base>
search_knowledge_base covers two curated corpora:
- Phaser 3 engineering: setup, scenes, physics, input, tweens/particles, state management,
  multiplayer netcode. Search it BEFORE writing an API you are not certain of.
- Game DESIGN: core loop, progression and rewards, difficulty/pacing/flow, onboarding and
  clarity, concrete feel tuning numbers (jump, coyote time, hit reactions), per-genre recipes
  (platformer, arcade, shooter, top-down, puzzle, roguelite, survivors, idle, tower defense,
  match), level design and randomness, scope and the shipping checklist.
At the START of a new game, search the design corpus for the genre recipe and the core loop doc
before you write the first file: the recipe names the minimum build, the numbers, and the way
that genre usually fails. Search it again when the game feels flat (juice, escalation, rewards)
or when the user asks for "more"/"harder"/"more fun" rather than guessing.
To learn from a specific web tutorial, call fetch_gamedev_doc with its URL, then search. If the
user asks for MULTIPLAYER, search "multiplayer" first; this app ships a WebSocket room relay
with a documented G.net client pattern.
</knowledge_base>`;

  static AI_RUNTIME = `<ai_runtime>
This is an AI-DRIVEN game: it runs inside LumaBrowser and calls the language model WHILE IT PLAYS
through the runtime at ${GameScaffold.AI_RUNTIME_REL} (already installed and loaded right after Phaser in
index.html; it is managed by LumaBrowser: NEVER edit, rewrite, or remove it or its script tag). The
runtime exposes ONE global, AI:
- await AI.ready()                       → { online, model, imageReady }. Call ONCE in BootScene before any other AI call.
- await AI.ask(prompt, opts)             → string, or an object when opts.json / opts.schema is set.
    opts: { system, history:[{role,content}], schema:{...shape...}, tools:[{name,description,parameters,handler}],
            temperature, think:true (allow reasoning; slower), onToken(delta, soFar) (streams text replies), maxSteps }
    With tools, the model may reply with a call; the runtime runs YOUR handler, feeds the result back, and
    loops until a final answer. The model can only touch what you expose. Handlers return JSON-serialisable data.
- AI.npc(id, { name, persona, knowledge, goal, maxSentences })  → { say(text, { context, onToken }) → Promise<string>,
    remember(fact), reset() }. Per-character memory, persisted automatically. Use it for every talking character.
- await AI.generate(what, { system, prompt, schema, think })    → object. Structure + flavour from the model
    (room list, monsters, names, quests); your CODE lays it out on the grid. Never ask the model for coordinates
    or tile arrays. Validate and clamp what comes back.
- AI.store  (async) get(col, key, fallback) / set(col, key, value) / list(col) / remove(col, key) / clear(col) / reset().
    The game's persistent data: party, inventory, quests, generated floors, save slots. Use it INSTEAD of
    localStorage. AI.storeTools(['quests']) returns ready-made tools that let the model read/write a collection.
- await AI.image({ prompt, width, height, style, transparent, key }) → { url, status }. Play-time art for truly
    emergent content only (slow; memoised by request). Foreseeable art goes through generate_asset at build time.
- AI.online / AI.onStatus(cb) → { online, pending }. Show a thinking indicator while pending > 0.
Design rules:
- Calls take seconds. Never await inside update(); keep the loop running; prefetch the next floor early and
  cache it in the store. Never call the model per frame or for math/dice/pathing; code does those instantly.
- Every AI-driven moment needs a hand-written fallback (AI.online false ⇒ ask returns '...', generate returns {}).
- Put stable rules in system, the current situation in the prompt; keep prompts short; give JSON shapes as
  concrete example objects.
- Build a reusable src/ui/DialogBox.js (streaming text, thinking state, choice buttons) and use it everywhere.
- Use test_ai_prompt to try a prompt/schema/tool set against the real model BEFORE you wire it into code.
</ai_runtime>`;

  static NO_TOOL_WORKFLOW = `<workflow>
Tool-driven building isn't enabled in this turn. Help the user design their game: sharpen the
premise into a concrete core loop, scenes, entities, and a build plan. When tools are available
the plan will be built as a real Phaser 3 project.
</workflow>`;
}

module.exports = GamePromptBlocks;
