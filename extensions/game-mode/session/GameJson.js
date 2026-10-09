const fs = require('fs');
const path = require('path');
const GameKind = require('./GameKind');

class GameJson {
  static FILE = 'game.json';

  static read(gameDir) {
    try {
      const json = JSON.parse(fs.readFileSync(path.join(gameDir, GameJson.FILE), 'utf8'));
      return json && typeof json === 'object' ? json : null;
    } catch (_) { return null; }
  }

  static nameOf(gameDir) {
    const json = GameJson.read(gameDir);
    return json && json.name ? String(json.name) : null;
  }

  static kindOf(gameDir) {
    const json = GameJson.read(gameDir);
    return GameKind.normalize(json && json.kind);
  }
}

module.exports = GameJson;
