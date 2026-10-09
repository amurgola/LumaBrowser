# AI game runtime (window.AI): patterns and recipes

AI games run inside LumaBrowser. The game folder ships `src/luma-ai.js` (managed,
never edit) which exposes ONE global, `AI`. Every call goes to the chat's own model
through the host; nothing here works from a plain web server, so an AI game is played
from the Play button, not exported.

## Boot

```js
// src/scenes/BootScene.js
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() { this.load.image('hero', 'assets/hero.png'); }
  async create() {
    const st = await AI.ready();          // { online, model, imageReady }
    G.state.online = st.online;           // offline = placeholders, keep the game playable
    this.scene.start('Game');
  }
}
```

Call `AI.ready()` exactly once, before the first `ask`. It also loads the persistent
store into memory so `AI.store.get` is instant afterwards.

## Talking to an NPC (memory + streaming)

```js
G.npcs = G.npcs || {};
G.npcs.mira = AI.npc('mira', {
  name: 'Mira',
  persona: 'A weary innkeeper who has seen too many adventurers die in the crypt below. Dry humour, kind underneath.',
  knowledge: 'The crypt entrance is behind the well. The last party went in three days ago.',
  goal: 'Talk the player out of going alone; if they insist, sell them a lantern.',
  maxSentences: 3,
});

// In the dialogue UI:
const box = new G.DialogBox(this);
box.showThinking('Mira');
const reply = await G.npcs.mira.say(playerLine, {
  context: `Player has ${G.state.gold} gold and is at the inn.`,
  onToken: (delta, soFar) => box.setText(soFar),   // streams word by word
});
box.setText(reply);
```

`AI.npc` keeps the conversation history per character and persists it in the store
(collection `_npc`), so Mira remembers the player across sessions. `npc.remember('The
player paid for the lantern')` adds a fact without a visible turn; `npc.reset()` forgets.

## Generating content as JSON

Always give a concrete shape. The model returns an object matching it.

```js
const dungeon = await AI.generate('a dungeon floor', {
  system: 'You design compact roguelike floors. Rooms are 5-9 tiles wide. Keep it grim.',
  prompt: `Floor ${depth}, theme: ${theme}. Include one boss room and one treasure room.`,
  schema: {
    name: 'string', theme: 'string',
    rooms: [{ id: 'string', kind: 'start|normal|treasure|boss', w: 'number', h: 'number', desc: 'string',
              monsters: [{ name: 'string', hp: 'number', atk: 'number' }] }],
    exits: [{ from: 'string', to: 'string' }],
  },
  think: true,          // allow reasoning for structural generation (slower)
});
G.state.floor = dungeon;
await AI.store.set('floors', `f${depth}`, dungeon);
```

Then LAY IT OUT IN CODE: the model gives structure and flavour (room list, monsters,
names, descriptions); your code places rooms on the grid, carves corridors, spawns
sprites. Do not ask the model for pixel coordinates or tile arrays: it is slow and
unreliable at that; procedural code is instant and correct.

Validate what comes back before using it (clamp numbers, default missing fields,
drop malformed rooms). A quantized local model will occasionally miss a field.

## Letting the model drive events with tools

Declare functions the model may call; the runtime runs your handler and loops
until the model gives a final answer. This is how "the AI runs the events it
creates" works: the model can only touch what you expose.

```js
const tools = [
  {
    name: 'give_item',
    description: 'Give the player an item.',
    parameters: { type: 'object', properties: { item: { type: 'string' }, qty: { type: 'number' } }, required: ['item'] },
    handler: ({ item, qty = 1 }) => { G.inventory.add(item, qty); return { ok: true, inventory: G.inventory.list() }; },
  },
  {
    name: 'spawn_encounter',
    description: 'Start a fight with the named monster group in the current room.',
    parameters: { type: 'object', properties: { monsters: { type: 'array', items: { type: 'string' } } }, required: ['monsters'] },
    handler: ({ monsters }) => G.combat.start(monsters),
  },
  ...AI.storeTools(['quests']),   // lets the model read/write the "quests" collection
];

const narration = await AI.ask(
  `The player searched the altar. Decide what happens and act on it. Then narrate in 2 sentences.`,
  { system: 'You are the dungeon master. Be fair but dangerous. Use at most one tool call unless more is truly needed.',
    tools, maxSteps: 4 },
);
G.hud.narrate(narration);
```

Rules of thumb:
- Keep 2-6 tools per call, each with a one-line description and a small schema.
- Handlers must be fast and must return JSON-serialisable results (what they return
  is what the model reads next).
- Set `maxSteps` (default 6) so a confused model cannot loop forever.
- Never expose a tool that can break the game state irrecoverably; validate args.

## Persistent data stores

```js
await AI.store.set('party', 'hero', { hp: 20, lvl: 1 });
const hero = await AI.store.get('party', 'hero', { hp: 20, lvl: 1 });  // fallback when missing
const quests = await AI.store.list('quests');                          // { key: value }
await AI.store.remove('quests', 'q1');
await AI.store.clear('floors');
await AI.store.reset();                                                // "new game"
```

Collections and keys: letters, digits, `_ . : -` (max 64 chars). One value ≤ 64 KB;
the whole store ≤ 4 MB. Use the store instead of localStorage: it lives with the game
and survives Reload, restart, and reopening the chat. Save at meaningful moments
(room cleared, level up, dialogue ended), not every frame.

## Play-time images

```js
const img = await AI.image({ prompt: 'goblin shaman with a bone staff', width: 64, height: 64, style: 'pixel-art', transparent: true, key: 'goblin-shaman' });
if (img.status === 'done') {
  this.load.image('goblin-shaman', img.url + '?v=' + Date.now());
  this.load.once('complete', () => this.add.image(x, y, 'goblin-shaman'));
  this.load.start();
}
```

Same request ⇒ same file (memoised under `assets/runtime/`). Generation takes seconds
and, on single-GPU machines, swaps the language model out and back in, so prefer
`generate_asset` at build time for anything you can foresee, and use `AI.image`
only for truly emergent content (a unique boss the model invented). `img.status` is
`'placeholder'` when this machine has no image generation.

## Latency and UX

- Every AI call takes 1-20 seconds on a local model. Show a thinking indicator, keep
  the game loop running, and never `await` inside `update()`.
- Fire content generation EARLY (start generating the next floor while the player
  explores this one) and cache it in the store.
- Fall back gracefully: `AI.online === false` means the game is running outside
  LumaBrowser (exported or headless). `ask` returns `'...'`, `generate` returns `{}`.
  Have hand-written defaults for the first floor, the first NPC line, the first quest.
- Do not call the model for things code can do (dice rolls, pathing, damage math).
  Call it for words, choices, and structure.
- Keep prompts short and concrete; put stable rules in `system`, the current
  situation in the prompt, and never re-send the whole game state.

## Status indicator

`AI.onStatus(({ online, pending }) => ...)` fires whenever calls start or finish; wire
it to a small HUD element so the player always knows the model is working. The Play
overlay in LumaBrowser also shows the same signal in its toolbar.
