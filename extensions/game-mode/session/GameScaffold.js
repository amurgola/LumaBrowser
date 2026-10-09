const fs = require('fs');
const path = require('path');
const GameKind = require('./GameKind');
const GameJson = require('./GameJson');

class GameScaffold {
  static PHASER_URL = '/llm-ui/lib/phaser/phaser.min.js';
  static AI_RUNTIME_REL = 'src/luma-ai.js';
  static AI_RUNTIME_SRC = path.join(__dirname, '..', 'luma-ai-runtime.js');

  static gameJson(name, kind) {
    const json = { name: name || 'Untitled game', version: 1, entry: 'index.html', kind: GameKind.normalize(kind) };
    return JSON.stringify(json, null, 2) + '\n';
  }

  static indexHtml(name, kind) {
    const title = String(name || 'New game').replace(/[<>&]/g, '');
    const ai = GameKind.normalize(kind) === GameKind.AI;
    const order = ai ? ', then the AI runtime (managed, never edit)' : '';
    const runtimeTag = ai ? `<script src="${GameScaffold.AI_RUNTIME_REL}"></script>\n` : '';
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  html, body { margin: 0; height: 100%; background: #10131a; color: #93a0b4;
    font: 14px/1.5 system-ui, sans-serif; display: flex; align-items: center; justify-content: center; }
  /* The placeholder line hides itself the moment a game canvas mounts, so a
     build that keeps this file never shows stale scaffold text over the game. */
  #game:has(canvas) p { display: none; }
</style>
</head>
<body>
<div id="game"><p>The agent hasn't built this game yet. Watch the chat.</p></div>
<!-- Engine first${order}, then game scripts in dependency order:
     state -> entities -> systems -> ui -> scenes -> main. Classic scripts, no modules. -->
<script src="${GameScaffold.PHASER_URL}"></script>
${runtimeTag}</body>
</html>
`;
  }

  static installAiRuntime(gameDir) {
    const dest = path.join(gameDir, GameScaffold.AI_RUNTIME_REL);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const source = fs.readFileSync(GameScaffold.AI_RUNTIME_SRC, 'utf8');
    if (GameScaffold._readOrNull(dest) !== source) fs.writeFileSync(dest, source, 'utf8');
    return dest;
  }

  static writeMissing(gameDir, name, kind) {
    fs.mkdirSync(path.join(gameDir, 'assets'), { recursive: true });
    GameScaffold._writeIfAbsent(path.join(gameDir, GameJson.FILE), GameScaffold.gameJson(name, kind));
    GameScaffold._writeIfAbsent(path.join(gameDir, 'index.html'), GameScaffold.indexHtml(name, kind));
    if (GameKind.normalize(kind) === GameKind.AI) GameScaffold._tryInstallAiRuntime(gameDir);
  }

  static _writeIfAbsent(file, content) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, content, 'utf8');
  }

  static _tryInstallAiRuntime(gameDir) {
    try { GameScaffold.installAiRuntime(gameDir); } catch (_) {}
  }

  static _readOrNull(file) {
    try { return fs.readFileSync(file, 'utf8'); } catch (_) { return null; }
  }
}

module.exports = GameScaffold;
