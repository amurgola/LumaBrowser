# GameScaffold

`extensions/game-mode/session/GameScaffold.js`

The starter files of a game folder and the managed AI runtime. Only missing files are written, so reopening a game never clobbers agent work.

## Methods

- `PHASER_URL` `/llm-ui/lib/phaser/phaser.min.js` (served by the gateway from node_modules); `AI_RUNTIME_REL` `src/luma-ai.js`; `AI_RUNTIME_SRC` the extension's `luma-ai-runtime.js`.
- `gameJson(name, kind)`, `indexHtml(name, kind)` the starter documents (AI games load the runtime right after Phaser; the title strips `<>&`).
- `installAiRuntime(gameDir)` copies the runtime in when it differs (every session, so upgrades reach old games).
- `writeMissing(gameDir, name, kind)` creates `assets/`, the two starters if absent, and the runtime for AI games (a failed copy is left for run_game to report).

## luma-ai-runtime.js

The in-game `window.AI` runtime is a browser script, but the main process reads it as data and copies it into each AI game, so it ships with the extension (copied from legacy, em-dashes removed) under its legacy name. It must not be bytecoded by the packaged build.
