# GameKickoff

`extensions/game-mode/ui/GameKickoff.js`

The first user turn Game mode sends from the setup brief.

## Methods

- `GameKickoff.message(data)`: with no premise, `Help me design and build a
  game. Ask me what I want to play.`; for `kind: 'ai'`, the AI-driven game
  brief (core loop with one real AI-driven moment, an offline fallback,
  progress in `AI.store`); otherwise the web game brief. A `name` adds
  `Name it "<name>".` on its own line.

## Globals

None.
