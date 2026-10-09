# GameSystemPrompt

`extensions/game-mode/prompts/GameSystemPrompt.js`

Assembles the Game mode system prompt from the conversation's setup: persona, project, AI runtime (AI games), Phaser facts, knowledge base, assets, workflow (or the no-tools block) and the user goal.

## Methods

- `GameSystemPrompt.build(data, { hasTools, imageReady, artStyle, alpha, models })`; `data` is `meta.data` (`premise`, `name`, `genre`, `kind`, `worldNotes`, `artStyle`). World notes appear only for AI games. No premise asks the user for a brief.
- `WEB_PERSONA`, `AI_PERSONA`.
